import { type NextRequest, NextResponse } from "next/server"
import { mockProducts, mockStockMovements } from "@/app/data/mockData"
import type { StockMovement } from "@/app/types/product"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { movementType, quantity, reason, referenceDocument, unitCost } = await request.json()

    const productIndex = mockProducts.findIndex((p) => p.id === params.id)
    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const product = mockProducts[productIndex]
    const previousStock = product.stockQuantity
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

    // Criar movimentação
    const movement: StockMovement = {
      id: (mockStockMovements.length + 1).toString(),
      productId: params.id,
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

    mockStockMovements.push(movement)

    // Atualizar estoque do produto
    mockProducts[productIndex] = {
      ...product,
      stockQuantity: newStock,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      message: "Movimentação de estoque realizada com sucesso",
      movement,
      product: mockProducts[productIndex],
    })
  } catch (error) {
    console.error("Erro na movimentação de estoque:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movements = mockStockMovements
      .filter((m) => m.productId === params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ movements })
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
