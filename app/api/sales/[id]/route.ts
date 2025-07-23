import { type NextRequest, NextResponse } from "next/server"
import { mockSales } from "@/app/data/salesData"
import { mockProducts, mockStockMovements } from "@/app/data/mockData"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sale = mockSales.find((s) => s.id === params.id)

    if (!sale) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ sale })
  } catch (error) {
    console.error("Erro ao buscar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const { status } = await request.json()
    const saleIndex = mockSales.findIndex((s) => s.id === params.id)

    if (saleIndex === -1) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    const sale = mockSales[saleIndex]

    // Se estiver cancelando uma venda, devolver itens ao estoque
    if (status === "cancelled" && sale.status === "completed") {
      for (const item of sale.items) {
        const productIndex = mockProducts.findIndex((p) => p.id === item.productId)
        if (productIndex !== -1) {
          const product = mockProducts[productIndex]
          const previousStock = product.stockQuantity
          const newStock = previousStock + item.quantity

          // Atualizar estoque do produto
          mockProducts[productIndex] = {
            ...product,
            stockQuantity: newStock,
            updatedAt: new Date().toISOString(),
          }

          // Criar movimentação de estoque (devolução)
          const movement = {
            id: (mockStockMovements.length + 1).toString(),
            productId: item.productId,
            userId: payload.userId,
            movementType: "IN" as const,
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: "Cancelamento de venda",
            referenceDocument: `CANCEL-${sale.id}`,
            createdAt: new Date().toISOString(),
          }

          mockStockMovements.push(movement)
        }
      }
    }

    // Atualizar status da venda
    mockSales[saleIndex] = {
      ...sale,
      status,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      message: "Venda atualizada com sucesso",
      sale: mockSales[saleIndex],
    })
  } catch (error) {
    console.error("Erro ao atualizar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
