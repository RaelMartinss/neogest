export async function GET() {
  try {
    const envVars = {
      JWT_SECRET: process.env.JWT_SECRET ? "✅ Existe" : "❌ Não existe",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Existe" : "❌ Não existe",
      NODE_ENV: process.env.NODE_ENV || "não definido",
    }

    return Response.json({
      success: true,
      environment: envVars,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Erro ao verificar variáveis de ambiente",
      },
      { status: 500 },
    )
  }
}
