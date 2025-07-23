import { type NextRequest, NextResponse } from "next/server"
import { invalidateSessionInDB } from "@/lib/session-service"
import { createAuditLog } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    console.log("=== LOGOUT API INICIADA ===")

    const token = request.cookies.get("auth-token")?.value

    if (token) {
      // Invalidar sessão no banco
      await invalidateSessionInDB(token)

      // Log de auditoria (opcional, não bloquear se falhar)
      createAuditLog({
        userId: "unknown", // Poderia extrair do token se necessário
        action: "LOGOUT",
        module: "auth",
        details: {},
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }).catch(console.error)
    }

    // Remover cookie
    const response = NextResponse.json({ message: "Logout realizado com sucesso" })
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("=== LOGOUT REALIZADO COM SUCESSO ===")
    return response
  } catch (error) {
    console.error("Erro no logout:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
