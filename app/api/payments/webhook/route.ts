import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { query } from "@/lib/db"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})
const payment = new Payment(client)

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const body = JSON.parse(bodyText)

    console.log("📩 Webhook recebido:", body)

    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ message: "Evento ignorado" }, { status: 200 })
    }

    const paymentId = body.data.id
    const mpPayment = await payment.get({ id: paymentId })

    console.log("🔍 Status:", mpPayment.status)
    console.log("🔗 external_reference:", mpPayment.external_reference)

    if (mpPayment.status === "approved") {
      const txid = mpPayment.external_reference

      if (!txid) {
        console.warn("⚠️ Pagamento sem txid (external_reference)")
        return NextResponse.json({ warning: "Sem txid" }, { status: 200 })
      }

      await query(
        `UPDATE payments_pix
         SET status_pagamento = 'confirmado',
             observacao = CONCAT(COALESCE(observacao, ''), ' | Confirmado via webhook em ', NOW())
         WHERE txid = $1
         RETURNING id`,
        [txid]
      )

      console.log("✅ Pagamento confirmado via webhook:", txid)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Erro no webhook:", error)
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 })
  }
}
