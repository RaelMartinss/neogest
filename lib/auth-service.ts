import { neon } from "@neondatabase/serverless"
import { mockUsers } from "@/app/data/mockData"

// Criar conexão direta
const sql = neon(process.env.DATABASE_URL!)

// Adicionar logs mais detalhados para mostrar o que está acontecendo

export async function getUserByEmail(email: string) {
  console.log("=== BUSCANDO USUÁRIO ===")
  console.log("DATABASE_URL disponível:", !!process.env.DATABASE_URL)
  console.log("Email procurado:", email)

  // Primeiro tenta no banco de dados
  try {
    console.log("Tentando buscar no banco de dados...")
    const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
    console.log("Resultado do banco:", result.length > 0 ? "ENCONTRADO" : "NÃO ENCONTRADO")

    if (result.length > 0) {
      const dbUser = result[0]
      console.log("Usuário do banco:", {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        isActive: dbUser.isActive ?? dbUser.is_active,
      })

      // Verificar se o usuário está ativo
      const isActive = dbUser.isActive ?? dbUser.is_active ?? true
      if (!isActive) {
        console.log("Usuário inativo no banco")
        return null
      }

      console.log("✅ USANDO DADOS DO BANCO")
      return dbUser
    }
  } catch (err) {
    console.log("❌ ERRO NO BANCO, usando mockUsers:", err instanceof Error ? err.message : err)
  }

  // Fallback para dados mockados
  console.log("🔄 USANDO DADOS MOCKADOS")
  const mockUser = mockUsers.find((u) => u.email === email && u.isActive)
  console.log("Usuário mock encontrado:", mockUser ? "SIM" : "NÃO")

  if (mockUser) {
    console.log("Dados do usuário mock:", {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    })
  }

  return mockUser || null
}

export async function getUserById(id: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    if (result.length) {
      const dbUser = result[0]
      if (dbUser.active === false || dbUser.isActive === false || dbUser.is_active === false) {
        return null
      }
      return dbUser
    }
  } catch (err) {
    console.warn("DB indisponível, usando mockUsers:", err)
  }
  return mockUsers.find((u) => u.id.toString() === id && u.isActive) ?? null
}

export async function updateLastLogin(userId: string) {
  try {
    await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${userId}`
    return true
  } catch {
    return false
  }
}

export async function createAuditLog(data: {
  userId: string
  action: string
  module: string
  details?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const { userId, action, module, details, ipAddress, userAgent } = data
    const logId = Date.now().toString()
    const detailsJson = details ? JSON.stringify(details) : null

    await sql`
      INSERT INTO audit_logs (id, "userId", action, module, details, "ipAddress", "userAgent", "createdAt") 
      VALUES (${logId}, ${userId}, ${action}, ${module}, ${detailsJson}, ${ipAddress || "unknown"}, ${userAgent || "unknown"}, CURRENT_TIMESTAMP)
    `

    return true
  } catch (error) {
    console.error("Erro ao criar log de auditoria:", error)
    return false
  }
}
