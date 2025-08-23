import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || undefined

    const result = await FinancialService.getCategorias(tipo)

    if (result.success) {
      return NextResponse.json({
        success: true,
        categorias: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro na API de categorias:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
