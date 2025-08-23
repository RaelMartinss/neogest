import { type NextRequest, NextResponse } from "next/server"
import { getFornecedorById, updateFornecedor } from "@/lib/purchases-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const fornecedor = await getFornecedorById(id)
    if (!fornecedor) {
      return NextResponse.json({ success: false, error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
    }

    const data = await request.json()
    const fornecedor = await updateFornecedor(id, data)

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
