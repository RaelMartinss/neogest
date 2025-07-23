import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/auth-service"
import { validateSessionFromDB } from "@/lib/session-service"

// Forçar rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {

    const token = request.cookies.get("auth-token-jwt")?.value
 
    if (!token) {
      return NextResponse.json({ error: " NOT AUTHENTICATED" }, { status: 401 })
    }
    const session = await validateSessionFromDB(token)
    if (!session) {
      console.log("Session invalid ou expired")
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
    }

    // Buscar usuário no banco
    const user = await getUserById(session.userId)
    
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    // Remover senha antes de retornar
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error internal server" }, { status: 500 })
  }
}
