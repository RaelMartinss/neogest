import { type NextRequest, NextResponse } from "next/server"
import { getCustomerById, updateCustomer, getCustomerStats, getCustomerPurchases } from "@/lib/customer-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await getCustomerById(params.id)

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const stats = await getCustomerStats(params.id)
    const purchases = await getCustomerPurchases(params.id)

    return NextResponse.json({
      customer: { ...customer, stats },
      purchases,
    })
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerData = await request.json()

    const customer = await updateCustomer(params.id, customerData)

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
