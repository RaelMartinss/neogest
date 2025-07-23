import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateLastLogin, createAuditLog } from "@/lib/auth-service"
import { generateToken } from "@/lib/auth"
import { createSessionInDB } from "@/lib/session-service"


export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }


    // Buscar usuário
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    try {
      const bcryptModule = await import("bcryptjs")
      const bcrypt = bcryptModule.default || bcryptModule

      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
      }
    } catch (bcryptError) {
      return NextResponse.json({ error: "Erro interno de autenticação" }, { status: 500 })
    }

    const tokenJWT = generateToken({userId: user.id.toString(), email: user.email, role: user.role})

    // Salvar sessão no banco com o token JWT
    await createSessionInDB(user.id.toString(), user.email, user.role, tokenJWT)

    // Atualizar último login
    await updateLastLogin(user.id.toString())

    await createAuditLog({
      userId: user.id.toString(),
      action: "LOGIN",
      module: "auth",
      details: { email },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    })

    // Preparar resposta
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      isActive: user.isActive ?? user.isActive ?? true,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }

    const response = NextResponse.json({
      user: userResponse,
      token: tokenJWT,
    })

    // Definir cookie
    response.cookies.set("auth-token", tokenJWT, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 1 dia
    })
    
    response.cookies.set("auth-token-jwt", tokenJWT, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 1 dia
    })
   
    return response
  } catch (error) {
    console.error("=== ERRO CRÍTICO NO LOGIN ===")
    console.error("Erro:", error)

    return NextResponse.json(
      {
        error: "Error internal server",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
