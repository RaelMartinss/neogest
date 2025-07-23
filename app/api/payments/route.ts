import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("💰 REGISTRANDO PAGAMENTO...")

    const paymentData = await request.json()
    console.log("📦 Dados do pagamento:", paymentData)

    const {
      saleId,
      operatorId,
      totalAmount,
      receivedAmount,
      changeAmount,
      paymentMethod,
      observation = null,
    } = paymentData

    // Validações
    if (!saleId || !operatorId || !totalAmount || !paymentMethod) {
      return NextResponse.json({ error: "Dados obrigatórios não informados" }, { status: 400 })
    }

    if (paymentMethod === "cash" && (!receivedAmount || receivedAmount < totalAmount)) {
      return NextResponse.json({ error: "Valor recebido deve ser maior ou igual ao valor da compra" }, { status: 400 })
    }

    // Inserir pagamento na tabela
    const paymentResult = await query(
      `INSERT INTO payments (
        id_venda, id_operador, valor_total_compra, valor_recebido,
        valor_troco, forma_pagamento, data_hora_pagamento, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *`,
      [
        saleId,
        operatorId,
        totalAmount,
        receivedAmount || totalAmount, // Para cartão/PIX, valor recebido = valor total
        changeAmount || 0,
        paymentMethod.toUpperCase(),
        observation,
      ],
    )

    const payment = paymentResult[0]
    console.log("✅ Pagamento registrado:", payment)

    return NextResponse.json({
      message: "Pagamento registrado com sucesso",
      payment,
    })
  } catch (error) {
    console.error("❌ Erro ao registrar pagamento:", error)
    return NextResponse.json(
      { error: `Erro ao registrar pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get("saleId")

    let sql = "SELECT * FROM payments"
    const params: any[] = []

    if (saleId) {
      sql += " WHERE id_venda = $1"
      params.push(saleId)
    }

    sql += " ORDER BY data_hora_pagamento DESC"

    const payments = await query(sql, params)

    return NextResponse.json({
      payments,
    })
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
