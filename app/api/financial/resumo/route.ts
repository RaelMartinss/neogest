import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = Number(searchParams.get("user_id")) || 1 // TODO: Pegar do token JWT

    const resumo = await FinancialService.getResumoFinanceiro(userId)
    const indicadores = await FinancialService.getIndicadores(userId)

    if (resumo.success && indicadores.success) {
      return NextResponse.json({
        success: true,
        resumo: resumo.data,
        indicadores: indicadores.data,
      })
    } else {
      return NextResponse.json({ success: false, error: "Erro ao buscar resumo financeiro" }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro na API de resumo:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
