import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'card'; // 'card' ou 'pix'

    if (!id) {
      return NextResponse.json({ error: 'ID do pagamento não informado' }, { status: 400 });
    }

    let result;
    if (type === 'pix') {
      result = await sql`SELECT id, status_pagamento as status, observacao FROM payments_pix WHERE id = ${id}`;
    } else {
      result = await sql`SELECT id, status_pagamento as status, observacao FROM payments_card WHERE id = ${id} OR transaction_id = ${id}`;
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: result[0].id,
      status: result[0].status,
      observacao: result[0].observacao,
    });
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);
    return NextResponse.json({ error: 'Erro ao consultar status' }, { status: 500 });
  }
} 