import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("Buscando estatísticas...")

    const stats = await sql`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN type = 'TROCA' THEN 1 END) as total_exchanges,
        COUNT(CASE WHEN type = 'DEVOLUCAO' THEN 1 END) as total_returns,
        COALESCE(SUM(total_amount), 0) as total_value,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'APROVADO' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'REJEITADO' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN type = 'TROCA' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_exchanges,
        COUNT(CASE WHEN type = 'DEVOLUCAO' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_returns,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as this_month_value,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_total,
        COUNT(CASE WHEN status = 'PENDENTE' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_pending
      FROM exchanges_returns
    `

    const result = stats[0]

    const statsData = {
      total: Number.parseInt(result.total_count) || 0,
      pending: Number.parseInt(result.pending_count) || 0,
      approved: Number.parseInt(result.approved_count) || 0,
      rejected: Number.parseInt(result.rejected_count) || 0,
      completed: Number.parseInt(result.completed_count) || 0,
      exchanges: Number.parseInt(result.total_exchanges) || 0,
      returns: Number.parseInt(result.total_returns) || 0,
      totalAmount: Number.parseFloat(result.total_value) || 0,
      monthly: {
        total: Number.parseInt(result.this_month_total) || 0,
        pending: Number.parseInt(result.this_month_pending) || 0,
        exchanges: Number.parseInt(result.this_month_exchanges) || 0,
        returns: Number.parseInt(result.this_month_returns) || 0,
        amount: Number.parseFloat(result.this_month_value) || 0,
      },
    }

    console.log("Estatísticas calculadas:", statsData)

    return NextResponse.json({
      success: true,
      data: statsData,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
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
