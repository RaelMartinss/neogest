import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { number: string } }) {
  try {
    const saleNumber = Number.parseInt(params.number)

    if (isNaN(saleNumber) || saleNumber <= 0) {
      return NextResponse.json({ error: "Número da venda inválido" }, { status: 400 })
    }

    console.log(`🔍 Buscando venda número: ${saleNumber}`)

    // Buscar venda pelo número
    const sales = await sql`
      SELECT
        s.*,
        COALESCE(c.name, 'CLIENTE PADRÃO') AS customer_name
      FROM sales AS s
      LEFT JOIN customers AS c ON c.id = s."customerId"
      WHERE s."saleNumber" = ${saleNumber}
      ORDER BY s."createdAt" DESC
      LIMIT 1
    `

    if (sales.length === 0) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    const sale = sales[0]

    // Buscar itens da venda
    const items = await sql`
      SELECT 
        si.*,
        p.name as product_name,
        p.codigo as product_code,
        p.barcode as product_barcode
      FROM sale_items si
      LEFT JOIN products p ON si."productId" = p.id
      WHERE si."saleId" = ${sale.id}
      ORDER BY si.id
    `

    // Buscar pagamentos
    const payments = await sql`
      SELECT * FROM payments 
      WHERE "id_venda" = ${sale.id}
      ORDER BY "data_hora_pagamento" DESC
      LIMIT 1
    `

    const saleData = {
      id: sale.id,
      saleNumber: sale.saleNumber,
      createdAt: sale.createdAt,
      customerName: sale.customerName,
      cpfUsuario: sale.cpfUsuario,
      total: Number.parseFloat(sale.totalAmount || "0"),
      subtotal: Number.parseFloat(sale.subtotal || "0"),
      discount: Number.parseFloat(sale.discount || "0"),
      status: sale.status || "completed",
      paymentMethod: payments[0]?.tipoPagamento || "unknown",
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name || "Produto não encontrado",
        productCode: item.product_code,
        productBarcode: item.product_barcode,
        quantity: Number.parseFloat(item.quantity || "0"),
        unitPrice: Number.parseFloat(item.unit_price || "0"),
        discount: Number.parseFloat(item.discount || "0"),
        total: Number.parseFloat(item.total_price || "0"),
      })),
    }

    console.log(`✅ Venda encontrada:`, saleData)

    return NextResponse.json(saleData)
  } catch (error) {
    console.error("❌ Erro ao buscar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
