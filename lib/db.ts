import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function query(text: string, params: any[] = []) {
  try {
    console.log("Executando query:", text, "com params:", params)

    if (params.length === 0) {
      const result = await sql`${text}`
      return result
    }

    // Use sql.query para queries com parâmetros posicionais
    const result = await sql.query(text, params)
    console.log("Query executada com sucesso, resultado:", result)
    return result
  } catch (error) {
    console.error("Erro na query:", error)
    throw error
  }
}
