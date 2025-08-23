import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    const result = await FinancialService.marcarComoPago(id, body.valor_pago, body.data_pagamento)

    if (result.success) {
      return NextResponse.json({
        success: true,
        conta: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao marcar como pago:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
