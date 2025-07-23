import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST() {
  try {
    console.log("🔧 Corrigindo tabela payments...")

    // Executar a correção
    await query(
      `ALTER TABLE payments 
       ALTER COLUMN forma_pagamento TYPE VARCHAR(20)`,
      []
    )

    console.log("✅ Campo forma_pagamento corrigido para VARCHAR(20)")

    // Verificar se a correção foi aplicada
    const structure = await query(
      `SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
       FROM information_schema.columns 
       WHERE table_name = $1 
         AND column_name = $2`,
      ['payments', 'forma_pagamento']
    )

    console.log("📋 Estrutura atualizada:", structure)

    return NextResponse.json({
      success: true,
      message: "Tabela payments corrigida com sucesso",
      structure: structure[0]
    })
  } catch (error) {
    console.error("❌ Erro ao corrigir tabela:", error)
    return NextResponse.json(
      { error: `Erro ao corrigir tabela: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 }
    )
  }
} 