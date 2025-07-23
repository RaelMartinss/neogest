import { type NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  console.log('🔔 Recebendo notificação do Mercado Pago...');
  try {
    const notification = await request.json();
    const paymentId = notification.data?.id;

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento não informado' }, { status: 400 });
    }

    // Verificar se temos o access token
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('⚠️ Access token não configurado, pulando verificação no MercadoPago');
      return NextResponse.json({ message: 'Webhook recebido (sem verificação)' });
    }

    // Verificar status no Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 },
    });
    const payment = new Payment(client);
    
    try {
      const paymentStatus = await payment.get({ id: paymentId });
      console.log('📦 Status do pagamento:', paymentStatus.status);

      if (paymentStatus.status === 'approved') {
        // Atualizar pagamento no banco
        const updateResult = await sql`
          UPDATE payments_card 
          SET status_pagamento = 'confirmado',
              observacao = CONCAT(COALESCE(observacao, ''), ' | Confirmado via webhook em ', NOW())
          WHERE transaction_id = ${paymentId}
          RETURNING *
        `;

        if (updateResult.length > 0) {
          console.log('✅ Pagamento com cartão confirmado via webhook:', updateResult[0].id);
        } else {
          console.log('⚠️ Pagamento não encontrado no banco:', paymentId);
        }
      } else {
        console.log('⚠️ Pagamento não aprovado:', paymentStatus.status);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status no MercadoPago:', error);
      // Continuar mesmo com erro
    }

    return NextResponse.json({ message: 'Notificação recebida' });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Erro ao processar notificação' }, { status: 500 });
  }
} 