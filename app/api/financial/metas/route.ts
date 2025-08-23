import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = Number(searchParams.get("user_id")) || 1 // TODO: Pegar do token JWT

    const result = await FinancialService.getMetas(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        metas: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro na API de metas:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const novaMeta = {
      ...body,
      user_id: 1, // TODO: Pegar do token JWT
    }

    const result = await FinancialService.createMeta(novaMeta)

    if (result.success) {
      return NextResponse.json({
        success: true,
        meta: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao criar meta:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
