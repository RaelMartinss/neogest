export const dynamic = "force-dynamic"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testando autenticação...")
    
    // Verificar cookies
    const authToken = request.cookies.get("auth-token")?.value
    const authTokenJwt = request.cookies.get("auth-token-jwt")?.value
    
    console.log("Cookies encontrados:")
    console.log("  - auth-token:", authToken ? "presente" : "ausente")
    console.log("  - auth-token-jwt:", authTokenJwt ? "presente" : "ausente")
    
    // Verificar headers
    const authorization = request.headers.get("authorization")
    console.log("  - Authorization header:", authorization ? "presente" : "ausente")
    
    // Testar chamada para /api/auth/me
    const meResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    })
    
    const meData = await meResponse.json()
    console.log("Resposta de /api/auth/me:", meResponse.status, meData)
    
    return NextResponse.json({
      cookies: {
        authToken: authToken ? "presente" : "ausente",
        authTokenJwt: authTokenJwt ? "presente" : "ausente",
      },
      headers: {
        authorization: authorization ? "presente" : "ausente",
      },
      meResponse: {
        status: meResponse.status,
        data: meData,
      },
    })
  } catch (error) {
    console.error("Erro no teste de auth:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
} 