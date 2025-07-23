import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

async function getUserById(id: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    const user = result.length > 0 ? result[0] : null
    if (user && (user.active === false || user.isActive === false || user.is_active === false)) {
      return null
    }
    if (user) return user
  } catch (error) {
    console.error("Erro ao buscar usuário no banco:", error)
  }

  // Fallback para mockUsers
  const { mockUsers } = await import("@/app/data/mockData")
  return mockUsers.find((u) => u.id.toString() === id && u.isActive) ?? null
}

async function getCashRegister(userId: string) {
  try {
    const result = await sql`SELECT * FROM cash_registers WHERE user_id = ${userId} AND is_open = true`
    return result.length > 0 ? result[0] : null
  } catch (error) {
      return null
  }
}

async function openCashRegister(userId: string, userName: string, openingAmount: number) {
  try {
    const existingCashRegister = await getCashRegister(userId)

    if (existingCashRegister) {
      throw new Error("Já existe um caixa aberto para este usuário")
    }

    const result = await sql`
      INSERT INTO cash_registers (
        user_id, user_name, opening_amount, current_amount,
        total_sales, total_cash, total_card, total_pix,
        is_open, opened_at
      ) VALUES (
        ${userId}, ${userName}, ${openingAmount}, ${openingAmount}, 
        ${0}, ${0}, ${0}, ${0}, ${true}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

async function closeCashRegister(userId: string) {
  try {
    const cashRegister = await getCashRegister(userId)

    if (!cashRegister) {
      throw new Error("Nenhum caixa aberto encontrado")
    }

    const result = await sql`
      UPDATE cash_registers 
      SET is_open = ${false}, closed_at = CURRENT_TIMESTAMP
      WHERE id = ${cashRegister.id}
      RETURNING *
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

async function getUserIdFromSessionToken(token: string): Promise<string | undefined> {
  try {
    const res =
      await sql`SELECT "userId" FROM sessions WHERE token = ${token} AND "isActive" = true AND "expiresAt" > NOW()`
    return res.length ? String(res[0].user_id) : undefined
  } catch (err) {
    return undefined
  }
}

export async function GET(request: NextRequest) {
  try {

    // token via cookie
    let token = request.cookies.get("auth-token-jwt")?.value

    // fallback: header Authorization: Bearer xxx
    if (!token) {
      const authHeader = request.headers.get("authorization") || ""
      const [, bearerToken] = authHeader.match(/^Bearer\s+(.+)$/i) || []
      if (bearerToken) token = bearerToken
    }

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    // -------- NOVA LÓGICA --------
    // --- EXTRAÇÃO DO userId ---
    token = token.trim().replace(/^"|"$/g, "") // remove aspas acidentais

    let userId: string | undefined

    // a) simple-token-123
    const simpleMatch = token.match(/^simple-token-(.+)$/)
    if (simpleMatch) {
      userId = simpleMatch[1]
    }

    // b) JWT
    if (!userId) {
      try {
        const payload = verifyToken(token)
        if (payload && typeof payload === "object" && "userId" in payload) {
          userId = String((payload as any).userId)
        }
      } catch (jwtErr) {
        console.error("Falha ao verificar JWT:", jwtErr)
      }
    }

    // c) sessão no banco
    if (!userId) {
      userId = await getUserIdFromSessionToken(token)
    }
    if (!userId) {
      
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const cashRegister = await getCashRegister(userId)

    return NextResponse.json({ cashRegister: cashRegister || null })
  } catch (error) {
    
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {

    // token via cookie
    let token = request.cookies.get("auth-token-jwt")?.value

    // fallback: header Authorization: Bearer xxx
    if (!token) {
      const authHeader = request.headers.get("authorization") || ""
      const [, bearerToken] = authHeader.match(/^Bearer\s+(.+)$/i) || []
      if (bearerToken) token = bearerToken
    }

    if (!token) {
      return NextResponse.json({ error: "Token not provided" }, { status: 401 })
    }

    token = token.trim().replace(/^"|"$/g, "")

    let userId: string | undefined

    if (!userId) {
      try {
        const payload = verifyToken(token)
        if (payload && typeof payload === "object" && "userId" in payload) {
          userId = String((payload as any).userId)
        }
      } catch (jwtErr) {
        console.error("Failed to verify JWT:", jwtErr)
      }
    }

    if (!userId) {
      userId = await getUserIdFromSessionToken(token)
    }

    if (!userId) {
      
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    let requestData
    try {
      requestData = await request.json()
      
    } catch (parseError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { action, amount } = requestData

    if (action === "open") {
     
      const openingAmount = Number(amount) || 0

      const cashRegister = await openCashRegister(userId, user.name, openingAmount)
      

      return NextResponse.json({
        message: "Caixa aberto com sucesso",
        cashRegister,
      })
    } else if (action === "close") {

      const cashRegister = await closeCashRegister(userId)

      return NextResponse.json({
        message: "Caixa fechado com sucesso",
        cashRegister,
      })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {

    if (error instanceof Error) {
      console.error("Mensagem:", error.message)
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
