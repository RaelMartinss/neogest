import { type NextRequest, NextResponse } from "next/server"
import { getAllCustomers, searchCustomers, createCustomer } from "@/lib/customer-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 API /api/customers - Recebendo requisição")
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    let customers
    if (query) {
      console.log(`🔍 Buscando clientes com query: "${query}"`)
      customers = await searchCustomers(query)
    } else {
      console.log("📋 Buscando todos os clientes")
      customers = await getAllCustomers()
    }

    console.log(`✅ Retornando ${customers.length} clientes`)
    return NextResponse.json({ customers })
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json()
    console.log("📝 Recebendo dados para criar cliente:", customerData)

    // Verificar se há ID sendo enviado e removê-lo para usar nanoid
    if (customerData.id) {
      console.log("⚠️ ID fornecido pelo cliente, removendo para usar nanoid")
      delete customerData.id
    }

    const customer = await createCustomer(customerData)

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 400 })
  }
}
