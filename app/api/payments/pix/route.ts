import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { pixService } from '@/lib/pix-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 GERANDO PIX...');

    const pixData = await request.json();
    console.log('📦 Dados do PIX:', pixData);

    const { saleId, operatorId, totalAmount, customerName, customerCpf } = pixData;

    // Validações básicas
    if (!saleId || !operatorId || !totalAmount) {
      return NextResponse.json({ error: 'Dados obrigatórios não informados' }, { status: 400 });
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 });
    }

    // Criar pagamento PIX
    const pixResponse = await pixService.createPixPayment({
      saleId,
      amount: totalAmount,
      customerName,
      customerCpf,
      description: `Venda ${saleId}`,
    });

    console.log('🎯 PIX gerado:', {
      txid: pixResponse.txid,
      amount: totalAmount,
      expiresAt: pixResponse.expiresAt,
    });

    // Salvar no banco
    const pixResult = await query(
      `INSERT INTO payments_pix (
        id_venda, id_operador, valor_total_compra, forma_pagamento,
        pix_codigo_transacao, pix_chave_destino, pix_nome_pagador,
        pix_cpf_cnpj_pagador, status_pagamento, observacao, txid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        saleId,
        operatorId,
        totalAmount,
        'PIX',
        pixResponse.txid,
        process.env.MERCADO_PAGO_PIX_KEY ?? 'pix@empresa.com.br',
        customerName ?? null,
        customerCpf ?? null,
        'pendente',
        `PIX gerado em ${new Date().toLocaleString('pt-BR')}`,
        pixResponse.txid,
      ]
    );

    const pixPayment = pixResult[0];
    console.log('✅ PIX registrado no banco:', pixPayment.id);

    return NextResponse.json({
      message: 'PIX gerado com sucesso',
      pix: {
        id: pixPayment.id,
        txid: pixResponse.txid,
        qrcode: pixResponse.qrcode,
        qrcodeImage: pixResponse.qrcodeImage,
        pixCopyPaste: pixResponse.pixCopyPaste,
        expiresAt: pixResponse.expiresAt,
        amount: totalAmount,
        status: 'pendente',
      },
    });
  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: `Erro ao gerar PIX: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');
    const txid = searchParams.get('txid');

    let sql = 'SELECT * FROM payments_pix WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (saleId) {
      paramCount++;
      sql += ` AND id_venda = $${paramCount}`;
      params.push(saleId);
    }

    if (txid) {
      paramCount++;
      sql += ` AND txid = $${paramCount}`;
      params.push(txid);
    }

    sql += ' ORDER BY data_hora_pagamento DESC';

    const pixPayments = await query(sql, params);

    return NextResponse.json({
      pixPayments,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos PIX:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}