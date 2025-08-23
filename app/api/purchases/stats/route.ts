import { NextResponse } from "next/server"
import { getPurchasesStats } from "@/lib/purchases-service"

export async function GET() {
  try {
    const stats = await getPurchasesStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas de compras:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
