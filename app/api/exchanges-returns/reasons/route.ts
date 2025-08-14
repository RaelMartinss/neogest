import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    console.log("Buscando motivos para tipo:", type)

    let reasons
    if (type && type !== "all") {
      reasons = await sql`
        SELECT 
          id,
          code,
          name,
          type,
          requires_approval
        FROM exchange_return_reasons 
        WHERE (type = ${type} OR type = 'AMBOS')
        ORDER BY name
      `
    } else {
      reasons = await sql`
        SELECT 
          id,
          code,
          name,
          type,
          requires_approval
        FROM exchange_return_reasons 
        ORDER BY type, name
      `
    }

    const mappedReasons = reasons.map((reason: any) => ({
      id: String(reason.id),
      code: reason.code,
      name: reason.name,
      type: reason.type,
      requiresApproval: Boolean(reason.requires_approval),
    }))

    console.log("Motivos encontrados:", mappedReasons.length)

    return NextResponse.json({
      success: true,
      data: mappedReasons,
    })
  } catch (error) {
    console.error("Erro ao buscar motivos:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
