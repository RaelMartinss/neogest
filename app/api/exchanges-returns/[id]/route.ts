import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    console.log("Buscando solicitação com ID:", id)

    // Buscar dados principais - removendo colunas que podem não existir
    const exchangeReturn = await sql`
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
      WHERE er.id = ${id}
    `

    if (exchangeReturn.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Solicitação não encontrada",
        },
        { status: 404 },
      )
    }

    const er = exchangeReturn[0]

    // Buscar itens
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
      WHERE exchange_return_id = ${id}
      ORDER BY id
    `

    const result = {
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
      items: items.map((item: any) => ({
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
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json()

    console.log("Atualizando solicitação:", id, data)

    if (!data.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Status é obrigatório",
        },
        { status: 400 },
      )
    }

    const validStatuses = ["PENDENTE", "APROVADO", "REJEITADO", "CONCLUIDO"]
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status inválido",
        },
        { status: 400 },
      )
    }

    // Atualizar status baseado no que foi solicitado
    if (data.status === "APROVADO" && data.userId) {
      await sql`
        UPDATE exchanges_returns 
        SET 
          status = ${data.status},
          approved_by = ${data.userId},
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    } else if (data.status === "REJEITADO" && data.userId) {
      // Verificar se as colunas existem antes de usar
      try {
        await sql`
          UPDATE exchanges_returns 
          SET 
            status = ${data.status},
            rejected_by = ${data.userId},
            rejected_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      } catch (error) {
        // Se as colunas não existem, atualizar apenas o status
        console.log("Colunas rejected_by/rejected_at não existem, atualizando apenas status")
        await sql`
          UPDATE exchanges_returns 
          SET 
            status = ${data.status},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      }
    } else if (data.status === "CONCLUIDO" && data.userId) {
      // Verificar se as colunas existem antes de usar
      try {
        await sql`
          UPDATE exchanges_returns 
          SET 
            status = ${data.status},
            completed_by = ${data.userId},
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      } catch (error) {
        // Se as colunas não existem, atualizar apenas o status
        console.log("Colunas completed_by/completed_at não existem, atualizando apenas status")
        await sql`
          UPDATE exchanges_returns 
          SET 
            status = ${data.status},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
        `
      }
    } else {
      // Atualizar apenas o status
      await sql`
        UPDATE exchanges_returns 
        SET 
          status = ${data.status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    return NextResponse.json({
      success: true,
      message: `Status atualizado para ${data.status}`,
    })
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
