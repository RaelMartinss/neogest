import { type NextRequest, NextResponse } from "next/server"
import { getEntregas, getEntregasHoje, getEntregasAtrasadas } from "@/lib/purchases-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const filter = searchParams.get("filter")

    let entregas
    console.log("Received query params:", { search, status, filter })
    if (filter === "hoje") {
      entregas = await getEntregasHoje()
    } else if (filter === "atrasadas") {
      entregas = await getEntregasAtrasadas()
    } else {
      console.log("Fetching entregas with search and status:", { search, status });
      entregas = await getEntregas(search, status)
    }

    return NextResponse.json({
      success: true,
      data: entregas,
    })
  } catch (error) {
    console.error("Erro ao buscar entregas:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
