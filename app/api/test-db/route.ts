import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 Testando conexão com banco...")

    // Teste 1: Query simples
    const result1 = await query("SELECT 1 as test")
    console.log("✅ Teste 1 - Query simples:", result1)

    // Teste 2: Contar produtos
    const result2 = await query("SELECT COUNT(*) as total FROM products")
    console.log("✅ Teste 2 - Contar produtos:", result2)

    // Teste 3: Query com parâmetro
    const result3 = await query("SELECT * FROM products WHERE id = $1 LIMIT 1", ["cmbe6dhn3000ccsy4hp59c6b1"])
    console.log("✅ Teste 3 - Query com parâmetro:", result3)

    return NextResponse.json({
      success: true,
      tests: {
        simpleQuery: result1,
        countProducts: result2,
        parameterQuery: result3,
      },
    })
  } catch (error) {
    console.error("❌ Erro no teste:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
