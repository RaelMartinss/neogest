import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      tipo: searchParams.get("tipo") || undefined,
      categoria: searchParams.get("categoria") || undefined,
      status: searchParams.get("status") || undefined,
      periodo: searchParams.get("periodo") || undefined,
      search: searchParams.get("search") || undefined,
      user_id: Number(searchParams.get("user_id")) || 1, // TODO: Pegar do token JWT
    }

    const result = await FinancialService.getContas(filters)

    if (result.success) {
      return NextResponse.json({
        success: true,
        contas: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro na API de contas:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // TODO: Validar dados de entrada
    const novaConta = {
      ...body,
      user_id: 1, // TODO: Pegar do token JWT
    }

    const result = await FinancialService.createConta(novaConta)

    if (result.success) {
      return NextResponse.json({
        success: true,
        conta: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao criar conta:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
