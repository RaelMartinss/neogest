import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "all"
    const status = searchParams.get("status") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("Parâmetros de busca:", { search, type, status, limit, offset })

    // Construir query base
    let query = `
      SELECT 
        er.id,
        er.number,
        er.type,
        er.original_sale_id,
        er.original_sale_number,
        er.customer_id,
        er.customer_name,
        er.user_id,
        er.user_name,
        er.reason_id,
        er.reason_description,
        er.status,
        er.total_amount,
        er.notes,
        er.approved_by,
        er.approved_at,
        er.created_at,
        er.updated_at,
        err.name as reason_name,
        err.requires_approval
      FROM exchanges_returns er
      LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
      WHERE 1=1
    `

    const params: any[] = []

    // Aplicar filtros
    if (search) {
      query += ` AND (er.number ILIKE $${params.length + 1} OR er.customer_name ILIKE $${params.length + 1} OR er.original_sale_number ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    if (type !== "all") {
      query += ` AND er.type = $${params.length + 1}`
      params.push(type)
    }

    if (status !== "all") {
      query += ` AND er.status = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY er.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    console.log("Query SQL:", query)
    console.log("Parâmetros:", params)

    // Executar query usando template literals do Neon
    let exchangesReturns
    if (params.length === 2) {
      // Apenas limit e offset
      exchangesReturns = await sql`
        SELECT 
          er.id,
          er.number,
          er.type,
          er.original_sale_id,
          er.original_sale_number,
          er.customer_id,
          er.customer_name,
          er.user_id,
          er.user_name,
          er.reason_id,
          er.reason_description,
          er.status,
          er.total_amount,
          er.notes,
          er.approved_by,
          er.approved_at,
          er.created_at,
          er.updated_at,
          err.name as reason_name,
          err.requires_approval
        FROM exchanges_returns er
        LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
        ORDER BY er.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search && type === "all" && status === "all") {
      // Apenas busca
      const searchPattern = `%${search}%`
      exchangesReturns = await sql`
        SELECT 
          er.id,
          er.number,
          er.type,
          er.original_sale_id,
          er.original_sale_number,
          er.customer_id,
          er.customer_name,
          er.user_id,
          er.user_name,
          er.reason_id,
          er.reason_description,
          er.status,
          er.total_amount,
          er.notes,
          er.approved_by,
          er.approved_at,
          er.created_at,
          er.updated_at,
          err.name as reason_name,
          err.requires_approval
        FROM exchanges_returns er
        LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
        WHERE (er.number ILIKE ${searchPattern} OR er.customer_name ILIKE ${searchPattern} OR er.original_sale_number ILIKE ${searchPattern})
        ORDER BY er.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Query complexa - usar query dinâmica
      const result = await sql.unsafe(query, params)
      exchangesReturns = result
    }

    console.log("Resultados encontrados:", exchangesReturns.length)

    // Buscar itens para cada troca/devolução
    for (const er of exchangesReturns) {
      const items = await sql`
        SELECT 
          id,
          product_id,
          product_name,
          product_code,
          quantity,
          unit_price,
          total_price as subtotal,
          new_product_id,
          new_product_name,
          new_quantity,
          new_unit_price
        FROM exchange_return_items
        WHERE exchange_return_id = ${er.id}
        ORDER BY id
      `
      er.items = items
    }

    // Mapear dados para o formato esperado
    const mappedData = exchangesReturns.map((er: any) => ({
      id: String(er.id),
      number: er.number,
      type: er.type,
      originalSaleId: er.original_sale_id ? String(er.original_sale_id) : null,
      originalSaleNumber: er.original_sale_number,
      customerId: er.customer_id ? String(er.customer_id) : null,
      customerName: er.customer_name,
      customerDocument: er.customer_document || null,
      userId: String(er.user_id),
      userName: er.user_name || "Usuário",
      reasonId: String(er.reason_id),
      reasonName: er.reason_name || "Motivo não encontrado",
      reasonDescription: er.reason_description,
      status: er.status,
      totalAmount: Number(er.total_amount) || 0,
      notes: er.notes,
      requiresApproval: Boolean(er.requires_approval),
      createdAt: er.created_at,
      updatedAt: er.updated_at,
      items: (er.items || []).map((item: any) => ({
        id: String(item.id),
        productId: String(item.product_id),
        productName: item.product_name,
        productCode: item.product_code,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
        newProductId: item.new_product_id ? String(item.new_product_id) : null,
        newProductName: item.new_product_name,
        newProductCode: item.new_product_code || null,
        newQuantity: Number(item.new_quantity || 0),
        newUnitPrice: Number(item.new_unit_price || 0),
        newSubtotal: Number((item.new_quantity || 0) * (item.new_unit_price || 0)),
      })),
    }))

    return NextResponse.json({
      success: true,
      data: mappedData,
      total: mappedData.length,
    })
  } catch (error) {
    console.error("Erro ao buscar trocas/devoluções:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log("Criando nova solicitação:", JSON.stringify(data, null, 2))

    // Validações básicas
    if (!data.type || !["TROCA", "DEVOLUCAO"].includes(data.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tipo deve ser TROCA ou DEVOLUCAO",
        },
        { status: 400 },
      )
    }

    if (!data.reasonId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Motivo e itens são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Validar itens
    for (const item of data.items) {
      if (!item.productId || !item.productName || item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Todos os itens devem ter produto, quantidade e preço válidos",
          },
          { status: 400 },
        )
      }

      // Para trocas, validar novo produto
      if (data.type === "TROCA") {
        if (!item.newProductId || !item.newProductName || item.newQuantity <= 0 || item.newUnitPrice < 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Para trocas, todos os itens devem ter novo produto, quantidade e preço válidos",
            },
            { status: 400 },
          )
        }
      }
    }

    // Gerar número sequencial
    const numberResult = await sql`SELECT generate_exchange_return_number(${data.type}) as number`
    const number = numberResult[0].number

    console.log("Número gerado:", number)

    // Calcular valor total
    const totalAmount = data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)

    console.log("Valor total calculado:", totalAmount)

    // Criar registro principal
    const exchangeReturn = await sql`
      INSERT INTO exchanges_returns (
        number, 
        type, 
        original_sale_id, 
        original_sale_number, 
        customer_id, 
        customer_name,
        customer_document,
        user_id, 
        user_name, 
        reason_id, 
        reason_description, 
        total_amount, 
        notes, 
        status
      ) VALUES (
        ${number}, 
        ${data.type}, 
        ${data.originalSaleId || null}, 
        ${data.originalSaleNumber || null},
        ${data.customerId || null}, 
        ${data.customerName || null},
        ${data.customerDocument || null},
        ${data.userId || 1}, 
        ${data.userName || "Usuário"}, 
        ${Number(data.reasonId)}, 
        ${data.reasonDescription || null},
        ${totalAmount}, 
        ${data.notes || null}, 
        'PENDENTE'
      ) RETURNING id, number
    `

    const exchangeReturnId = exchangeReturn[0].id
    const createdNumber = exchangeReturn[0].number

    console.log("Solicitação criada com ID:", exchangeReturnId, "Número:", createdNumber)

    // Criar itens
    for (const item of data.items) {
      const totalPrice = item.quantity * item.unitPrice
      const newSubtotal = data.type === "TROCA" ? (item.newQuantity || 0) * (item.newUnitPrice || 0) : 0

      console.log("Inserindo item:", {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        newProductId: item.newProductId,
        newQuantity: item.newQuantity,
        newUnitPrice: item.newUnitPrice,
        newSubtotal,
      })

      await sql`
        INSERT INTO exchange_return_items (
          exchange_return_id, 
          product_id, 
          product_name, 
          product_code,
          quantity, 
          unit_price, 
          total_price,
          new_product_id, 
          new_product_name,
          new_product_code,
          new_quantity, 
          new_unit_price,
          new_subtotal
        ) VALUES (
          ${exchangeReturnId}, 
          ${Number(item.productId)}, 
          ${item.productName}, 
          ${item.productCode || null},
          ${item.quantity}, 
          ${item.unitPrice}, 
          ${totalPrice},
          ${item.newProductId ? Number(item.newProductId) : null}, 
          ${item.newProductName || null},
          ${item.newProductCode || null},
          ${item.newQuantity || 0}, 
          ${item.newUnitPrice || 0},
          ${newSubtotal}
        )
      `
    }

    console.log("Todos os itens inseridos com sucesso")

    // Buscar a solicitação criada com todos os dados
    const createdExchangeReturn = await sql`
      SELECT 
        er.*,
        err.name as reason_name,
        err.requires_approval
      FROM exchanges_returns er
      LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
      WHERE er.id = ${exchangeReturnId}
    `

    const createdData = createdExchangeReturn[0]

    return NextResponse.json({
      success: true,
      message: `${data.type === "TROCA" ? "Troca" : "Devolução"} criada com sucesso!`,
      data: {
        id: String(createdData.id),
        number: createdData.number,
        type: createdData.type,
        status: createdData.status,
        totalAmount: Number(createdData.total_amount),
        reasonName: createdData.reason_name,
        requiresApproval: Boolean(createdData.requires_approval),
        createdAt: createdData.created_at,
      },
    })
  } catch (error) {
    console.error("Erro ao criar solicitação:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

