import { neon } from "@neondatabase/serverless"
import { generateToken, verifyToken } from "./auth"
import { nanoid } from "nanoid"

const sql = neon(process.env.DATABASE_URL!)

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
  isActive: boolean
}

// Agora aceita token externo
export async function createSessionInDB(userId: string, email: string, role: string, token: string): Promise<string> {
  try {
    // Calcular data de expiração (7 dias)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Inserir sessão no banco
    try {
      await sql`
        INSERT INTO sessions (id, "userId", token, "expiresAt", "isActive")
        VALUES (${nanoid()}, ${userId}, ${token}, ${expiresAt.toISOString()}, true)
      `
      console.log("Sessão criada no banco:", { userId, expiresAt })
    } catch (err) {
      console.error("Falha ao inserir sessão (DB offline ou tabela ausente):", err)
      // Não lançamos — vamos apenas seguir com o token gerado
    }
    return token
  } catch (error) {
    console.error("Erro ao criar sessão no banco:", error)
    throw new Error("Erro ao criar sessão")
  }
}

export async function validateSessionFromDB(token: string): Promise<Session | null> {
  try {
    console.log("🔍 Validando sessão com token:", token.substring(0, 50) + "...")
    
    // Primeiro verificar se o JWT é válido
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ Token JWT inválido")
      return null
    }
    
    console.log("✅ Token JWT válido, payload:", payload)

    // Buscar sessão no banco
    const result = await sql`
      SELECT id, "userId" as "userId", token, "expiresAt" as "expiresAt", 
             "createdAt" as "createdAt", "isActive" as "isActive"
      FROM sessions 
      WHERE token = ${token}
        AND "isActive" = true 
        AND DATE("expiresAt") > CURRENT_DATE
    `

    console.log("🔍 Resultado da busca no banco:", result.length, "sessões encontradas")
    
    if (result.length === 0) {
      console.log("❌ Sessão não encontrada ou expirada no banco")
      
      // Verificar se existe alguma sessão para este token (mesmo inativa)
      const allSessions = await sql`
        SELECT id, "userId" as "userId", token, "expiresAt" as "expiresAt", 
               "createdAt" as "createdAt", "isActive" as "isActive"
        FROM sessions 
        WHERE token = ${token}
      `
      console.log("🔍 Todas as sessões para este token:", allSessions.length)
      if (allSessions.length > 0) {
        console.log("🔍 Detalhes da sessão:", allSessions[0])
      }
      
      return null
    }

    const session = result[0] as Session
    console.log("✅ Sessão válida encontrada:", { id: session.id, userId: session.userId })

    return session
  } catch (error) {
    console.error("❌ Erro ao validar sessão:", error)
    return null
  }
}

export async function invalidateSessionInDB(token: string): Promise<void> {
  try {
    const result = await sql`
      UPDATE sessions 
      SET "isActive" = false 
      WHERE token = ${token}
    `
    console.log("Sessão invalidada no banco")
  } catch (error) {
    console.error("Erro ao invalidar sessão:", error)
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await sql`
      UPDATE sessions 
      SET "isActive" = false 
      WHERE "expiresAt" < NOW() AND "isActive" = true
    `
    console.log(`${result.length} sessões expiradas limpas`)
  } catch (error) {
    console.error("Erro ao limpar sessões expiradas:", error)
  }
}
