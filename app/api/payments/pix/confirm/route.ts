import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { pixService } from "@/lib/pix-service";

export async function POST(request: NextRequest) {
  try {
    console.log("✅ CONFIRMANDO PAGAMENTO PIX...");
    const data = await request.json();
    console.log("📦 Dados recebidos data:", data);
    const txid = data?.data.id;
    
    // const { txid, payerName, payerDocument } = await request.json();
    // console.log("📦 Dados recebidos:", { txid, payerName, payerDocument });
    if (!txid) {
      return NextResponse.json(
        { error: "TXID é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar status no Mercado Pago
    const status = await pixService.checkPixStatus(txid);
    console.log("🔍 Status do PIX:", status);
    if (status !== "approved") {
      console.warn("❌ PIX não confirmado:", status);
      return NextResponse.json(
        { error: `PIX não confirmado. Status: ${status}` },
        { status: 400 }
      );
    }

    // Buscar PIX no banco
    const pixPayments = await query(
      `SELECT * FROM payments_pix WHERE txid = $1`,
      [txid]
    );
    console.log("🔍 PIX encontrado:", pixPayments.length);
    if (pixPayments.length === 0) {
      return NextResponse.json(
        { error: "PIX não encontrado" },
        { status: 404 }
      );
    }

    const pixPayment = pixPayments[0];

    if (pixPayment.status_pagamento === "approved") {
      return NextResponse.json({ message: "PIX já confirmado" });
    }

    // Confirmar pagamento no banco
    const updateResult = await query(
      `UPDATE payments_pix 
       SET status_pagamento = 'confirmado',
           pix_nome_pagador = COALESCE($1, pix_nome_pagador),
           pix_cpf_cnpj_pagador = COALESCE($2, pix_cpf_cnpj_pagador),
           observacao = CONCAT(COALESCE(observacao, ''), ' | Confirmado em ', NOW())
       WHERE txid = $3
       RETURNING *`,
      ['cliente', 'payerDocument', txid]
    );

    const confirmedPayment = updateResult[0];
    console.log("✅ PIX confirmado:", confirmedPayment.id);

    return NextResponse.json({
      message: "PIX confirmado com sucesso",
      payment: {
        id: confirmedPayment.id,
        txid: confirmedPayment.txid,
        status: confirmedPayment.status_pagamento,
        amount: confirmedPayment.valor_total_compra,
        confirmedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao confirmar PIX:", error);
    return NextResponse.json(
      {
        error: `Erro ao confirmar PIX: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 }
    );
  }
}
