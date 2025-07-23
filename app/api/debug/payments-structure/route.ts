import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 Verificando estrutura da tabela payments...")

    // Verificar se a tabela existe
    const tableExists = await query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_name = $1`,
      ['payments']
    )

    if (tableExists.length === 0) {
      return NextResponse.json({ 
        error: "Tabela payments não existe",
        suggestion: "Execute o script para criar a tabela payments"
      })
    }

    // Verificar estrutura da tabela
    const structure = await query(
      `SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
       FROM information_schema.columns 
       WHERE table_name = $1 
       ORDER BY ordinal_position`,
      ['payments']
    )

    console.log("📋 Estrutura da tabela payments:", structure)

    return NextResponse.json({
      tableExists: true,
      structure,
      message: "Estrutura da tabela payments verificada"
    })
  } catch (error) {
    console.error("❌ Erro ao verificar estrutura:", error)
    return NextResponse.json(
      { error: `Erro ao verificar estrutura: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 }
    )
  }
} 