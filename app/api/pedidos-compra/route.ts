import { type NextRequest, NextResponse } from "next/server"
import { getPedidosCompra, createPedidoCompra } from "@/lib/purchases-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const fornecedor_id = searchParams.get("fornecedor_id")
      ? Number.parseInt(searchParams.get("fornecedor_id")!)
      : undefined
    console.log("Received query params:", { search, status, fornecedor_id })
    const pedidos = await getPedidosCompra(search, status, fornecedor_id)

    return NextResponse.json({
      success: true,
      data: pedidos,
    })
  } catch (error) {
    console.error("Erro ao buscar pedidos de compra:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validações básicas
    if (!data.fornecedor_id) {
      return NextResponse.json({ success: false, error: "Fornecedor é obrigatório" }, { status: 400 })
    }

    if (!data.itens || data.itens.length === 0) {
      return NextResponse.json({ success: false, error: "Pelo menos um item é obrigatório" }, { status: 400 })
    }

    const pedido = await createPedidoCompra(data)

    return NextResponse.json({
      success: true,
      data: pedido,
    })
  } catch (error) {
    console.error("Erro ao criar pedido de compra:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
