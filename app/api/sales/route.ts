import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { SaleItem } from "@/app/types/sale"
import { nanoid } from "nanoid"
import { neon } from "@neondatabase/serverless"


const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const sales = await sql`SELECT * FROM sales ORDER BY "createdAt" DESC LIMIT 10`	
    const customers = await sql`SELECT * FROM customers LIMIT 10`

    return NextResponse.json({
      sales,
      customers,
    })
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 INICIANDO VENDA...")

    // USAR DADOS FIXOS PARA TESTE (sem autenticação por enquanto)
    const payload = { userId: "cmbe6dlm6000jcsy4qmjjgvi5", email: "test@test.com" }

    const saleData = await request.json()
    console.log("📦 Dados recebidos:", JSON.stringify(saleData, null, 2))

    const { items, paymentMethod, customerId, customerName, discount = 0, cpfInput = "", includeCpf = false } = saleData

    // ------------------------------------------------------------------
    // Sanitizar CPF  ➜ mantém só dígitos (máx. 11)  e valida comprimento
    // ------------------------------------------------------------------
    const cpfDigits = cpfInput.replace(/\D/g, "") // remove . e -
    if (includeCpf && cpfDigits.length !== 0 && cpfDigits.length !== 11) {
      return NextResponse.json({ error: "CPF inválido. Informe 11 dígitos ou deixe em branco." }, { status: 400 })
    }

    console.log("🔍 CPF Info:", { cpfInput, includeCpf })

    if (!items || items.length === 0) {
      console.log("❌ Erro: Nenhum item na venda")
      return NextResponse.json({ error: "Venda deve ter pelo menos um item" }, { status: 400 })
    }

    console.log("🔍 Verificando estoque...")
    // Verificar estoque disponível
    for (const item of items) {
      console.log(`Verificando produto: ${item.productId}`)
      const productResult = await query("SELECT * FROM products WHERE id = $1", [item.productId])

      if (productResult.length === 0) {
        console.log(`❌ Produto não encontrado: ${item.productId}`)
        return NextResponse.json({ error: `Produto ${item.productName} não encontrado` }, { status: 400 })
      }

      const product = productResult[0]
      if (product.stock_quantity < item.quantity) {
        console.log(`❌ Estoque insuficiente para ${product.name}`)
        return NextResponse.json(
          { error: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock_quantity}` },
          { status: 400 },
        )
      }
    }

    console.log("👤 Buscando usuário...")
    const userResult = await query("SELECT name FROM users WHERE id = $1", [payload.userId])
    const userName = userResult.length > 0 ? userResult[0].name : payload.email

    console.log("🔢 Calculando próximo número de venda...")
    const sqli = neon(process.env.DATABASE_URL!)
    const lastSale = await sqli`SELECT MAX("saleNumber") as max FROM sales`
    const nextSaleNumber = (lastSale[0]?.max ?? 0) + 1

    // Calcular totais
    const subtotal = items.reduce((sum: number, item: SaleItem) => sum + item.total, 0)
    const total = subtotal - discount

    console.log("💾 Inserindo venda no banco...")
    const saleId = nanoid()

    // Preparar CPF para inserção
    const cpfToSave = includeCpf && cpfDigits ? cpfDigits : null
    console.log("💳 CPF que será salvo:", cpfToSave)

    // Criar venda no banco - CORRIGIDO para incluir todos os campos
    const saleResult = await query(
      `INSERT INTO sales (
        id, "customerId", "userId", "totalAmount", "saleNumber",
        "cpfUsuario", "tipoPagamento", "createdAt", "customerName",
        "status", "subtotal", "discount", "user_name", "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        saleId,
        customerId ?? null,
        payload.userId,
        total,
        nextSaleNumber, // ← Este é o número sequencial correto
        cpfToSave,
        paymentMethod,
        customerName ?? "CLIENTE PADRÃO",
        "completed",
        subtotal,
        discount,
        userName,
      ],
    )

    const sale = saleResult[0]
    console.log("✅ Venda criada:", sale)
    console.log("🔢 Sale Number:", sale.saleNumber) // ← Verificar se está correto

    console.log("📋 Inserindo itens...")
    const saleItems = []
    for (const item of items) {
      // 🎯 BUSCAR CÓDIGO DO PRODUTO ANTES DE INSERIR
      const productResult = await query("SELECT codigo, barcode FROM products WHERE id = $1", [item.productId])
      const product = productResult[0]

      console.log(`🏷️ Produto ${item.productId}:`, {
        codigo: product?.codigo,
        barcode: product?.barcode,
        itemBarcode: item.productBarcode,
      })

      const itemResult = await query(
        `INSERT INTO sale_items (
          id, "saleId", "productId", "quantity", "unitPrice", "totalPrice",
          "product_name", "product_barcode", "discount", "product_code"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          nanoid(),
          sale.id,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.total,
          item.productName ?? null,
          product?.barcode ?? item.productBarcode ?? null, // ← Código de barras do banco
          item.discount ?? 0,
          product?.codigo ?? null, // ← CÓDIGO INTERNO do banco
        ],
      )

      const saleItem = itemResult[0]
      // Adicionar os códigos ao item retornado
      saleItem.product_code = product?.codigo
      saleItem.product_barcode = product?.barcode

      saleItems.push(saleItem)
    }

    console.log("📦 Atualizando estoque...")
    for (const item of items) {
      const productResult = await query("SELECT * FROM products WHERE id = $1", [item.productId])
      const product = productResult[0]
      const newStock = product.stock_quantity - item.quantity
    
      await query(`UPDATE products SET stock_quantity = $1, "updated_at" = CURRENT_TIMESTAMP WHERE id = $2`, [
        newStock,
        item.productId,
      ])
    }

    const completeSale = {
      ...sale,
      items: saleItems,
      id: sale.id,
      saleNumber: sale.saleNumber, // ← Garantir que está aqui
      total: sale.totalAmount,
      createdAt: sale.createdAt,
      // Incluir CPF na resposta
      cpfUsuario: sale.cpfUsuario,
      includeCpf: !!sale.cpfUsuario,
    }

    console.log("🎉 VENDA FINALIZADA COM SUCESSO!")
    console.log("🔢 Sale Number na resposta:", completeSale.saleNumber)
    console.log(
      "📋 Itens com códigos:",
      saleItems.map((i) => ({
        name: i.product_name,
        codigo: i.product_code,
        barcode: i.product_barcode,
      })),
    )

    return NextResponse.json({
      message: "Venda realizada com sucesso",
      sale: completeSale,
    })
  } catch (error) {
    console.error("❌ ERRO DETALHADO:", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    })

    return NextResponse.json(
      {
        error: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 },
    )
  }
}
