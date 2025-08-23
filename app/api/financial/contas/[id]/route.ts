import { NextResponse } from "next/server"
import { FinancialService } from "@/lib/financial-service"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    const result = await FinancialService.updateConta(id, body)

    if (result.success) {
      return NextResponse.json({
        success: true,
        conta: result.data,
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao atualizar conta:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    const result = await FinancialService.deleteConta(id)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Conta deletada com sucesso",
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao deletar conta:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
