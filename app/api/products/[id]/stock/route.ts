import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { movementType, quantity, reason, referenceDocument, unitCost } = await request.json()
    const productId = params.id

    // Buscar produto no banco
    const products = await sql`SELECT * FROM products WHERE id = ${productId}`
    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }
    const product = products[0]
    const previousStock = Number(product.stockQuantity)
    let newStock = previousStock

    // Calcular novo estoque baseado no tipo de movimentação
    switch (movementType) {
      case "IN":
        newStock = previousStock + quantity
        break
      case "OUT":
        newStock = Math.max(0, previousStock - quantity)
        break
      case "ADJUSTMENT":
        newStock = quantity
        break
      default:
        return NextResponse.json({ error: "Tipo de movimentação inválido" }, { status: 400 })
    }

    // Atualizar estoque no banco
    await sql`UPDATE products SET "stockQuantity" = ${newStock}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ${productId}`

    // Registrar movimentação (opcional: criar tabela de movimentações reais)
    // Aqui apenas retornamos os dados da movimentação
    const movement = {
      id: undefined, // Se tiver tabela real, gerar id
      productId,
      userId: "1", // Em produção, pegar do token JWT
      movementType,
      quantity: movementType === "ADJUSTMENT" ? quantity - previousStock : quantity,
      previousStock,
      newStock,
      unitCost,
      totalCost: unitCost ? unitCost * Math.abs(quantity) : undefined,
      reason,
      referenceDocument,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      message: "Movimentação de estoque realizada com sucesso",
      movement,
      product: { ...product, stockQuantity: newStock, updatedAt: new Date().toISOString() },
    })
  } catch (error) {
    console.error("Erro na movimentação de estoque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Aqui deveria buscar as movimentações reais do banco, se existir tabela
    // Por enquanto, retorna vazio
    return NextResponse.json({ movements: [] })
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
