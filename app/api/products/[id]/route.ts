import { type NextRequest, NextResponse } from "next/server"
import { mockProducts } from "@/app/data/mockData"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = mockProducts.find((p) => p.id === params.id)

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productData = await request.json()
    const productIndex = mockProducts.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Verificar se código de barras já existe em outro produto
    if (productData.barcode && mockProducts.some((p) => p.barcode === productData.barcode && p.id !== params.id)) {
      return NextResponse.json({ error: "Código de barras já existe" }, { status: 400 })
    }

    const updatedProduct = {
      ...mockProducts[productIndex],
      ...productData,
      id: params.id, // Manter o ID original
      updatedAt: new Date().toISOString(),
    }

    mockProducts[productIndex] = updatedProduct

    return NextResponse.json({
      message: "Produto atualizado com sucesso",
      product: updatedProduct,
    })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productIndex = mockProducts.findIndex((p) => p.id === params.id)

    if (productIndex === -1) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const deletedProduct = mockProducts.splice(productIndex, 1)[0]

    return NextResponse.json({
      message: "Produto excluído com sucesso",
      product: deletedProduct,
    })
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
