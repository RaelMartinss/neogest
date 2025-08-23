import { type NextRequest, NextResponse } from "next/server"
import { getFornecedores, createFornecedor } from "@/lib/purchases-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined

    const fornecedores = await getFornecedores(search, status)

    return NextResponse.json({
      success: true,
      data: fornecedores,
    })
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validações básicas
    if (!data.nome) {
      return NextResponse.json({ success: false, error: "Nome é obrigatório" }, { status: 400 })
    }

    const fornecedor = await createFornecedor(data)

    return NextResponse.json({
      success: true,
      data: fornecedor,
    })
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
