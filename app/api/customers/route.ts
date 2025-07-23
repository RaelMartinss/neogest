import { type NextRequest, NextResponse } from "next/server"
import { getAllCustomers, searchCustomers, createCustomer } from "@/lib/customer-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    let customers
    if (query) {
      customers = await searchCustomers(query)
    } else {
      customers = await getAllCustomers()
    }

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json()

    const customer = await createCustomer(customerData)

    if (!customer) {
      return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 400 })
    }

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
