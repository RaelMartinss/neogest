import { type NextRequest, NextResponse } from "next/server"
import { getPedidoCompraById, updatePedidoCompraStatus } from "@/lib/purchases-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const pedido = await getPedidoCompraById(id)
    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: pedido,
    })
  } catch (error) {
    console.error("Erro ao buscar pedido de compra:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ success: false, error: "Status é obrigatório" }, { status: 400 })
    }

    const pedido = await updatePedidoCompraStatus(id, status)

    return NextResponse.json({
      success: true,
      data: pedido,
    })
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
