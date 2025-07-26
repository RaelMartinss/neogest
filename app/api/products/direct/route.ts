import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  try {
    console.log("🔄 API /api/products/direct - Buscando produtos para PDV...")

    // Buscar apenas produtos ativos com informações essenciais para PDV
    const products = await sql`
      SELECT 
        id,
        name,
        barcode,
        codigo,
        "stockQuantity",
        "salePrice",
        "isActive",
        status
      FROM products 
      WHERE "isActive" = true 
      ORDER BY codigo, name
    `

    console.log(`✅ ${products.length} produtos encontrados para PDV`)

    // Mapear os produtos para o formato esperado pelo PDV
    const mappedProducts = products.map((product: any) => ({
      id: String(product.id),
      name: product.name,
      barcode: product.barcode || "",
      codigo: product.codigo || "",
      stockQuantity: Number(product.stockQuantity) || 0,
      salePrice: Number(product.salePrice) || 0,
      isActive: Boolean(product.isActive),
      status: product.status || "NORMAL"
    }))

    console.log("🏷️ Códigos de barras disponíveis:", mappedProducts.map(p => p.barcode))

    return NextResponse.json({
      success: true,
      products: mappedProducts
    })

  } catch (error) {
    console.error("❌ Erro na API /api/products/direct:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno ao buscar produtos",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      }, 
      { status: 500 }
    )
  }
} 