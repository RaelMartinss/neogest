import { type NextRequest, NextResponse } from "next/server"
import { mockUsers, mockAuditLogs } from "@/app/data/mockData"
import { hashPassword } from "@/lib/auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar permissão
    const currentUser = mockUsers.find((u) => u.id === payload.userId)
    const hasPermission = currentUser?.permissions.some((p) => p.module === "usuarios" && p.actions.includes("view"))

    if (!hasPermission) {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 })
    }

    // Retornar usuários sem as senhas
    const usersWithoutPasswords = mockUsers.map(({ password, ...user }) => user)

    return NextResponse.json({ users: usersWithoutPasswords })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar permissão
    const currentUser = mockUsers.find((u) => u.id === payload.userId)
    const hasPermission = currentUser?.permissions.some((p) => p.module === "usuarios" && p.actions.includes("create"))

    if (!hasPermission) {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 })
    }

    const { name, email, password, role, permissions } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Verificar se o email já existe
    const existingUser = mockUsers.find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Criar usuário
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      name,
      email,
      password: hashedPassword,
      role,
      permissions: permissions || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    }

    mockUsers.push(newUser)

    // Registrar log de auditoria
    mockAuditLogs.push({
      id: (mockAuditLogs.length + 1).toString(),
      userId: payload.userId,
      action: "CREATE_USER",
      module: "usuarios",
      details: { createdUserId: newUser.id, email: newUser.email },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      createdAt: new Date().toISOString(),
    })

    // Remover senha do objeto de usuário antes de retornar
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
