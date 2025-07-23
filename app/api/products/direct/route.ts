import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    console.log("🔍 Buscando produtos direto do banco...");

    const products = await sql`
        SELECT
          id,
          name,
          barcode,
          description,
          "stockQuantity",
          "salePrice",
          "isActive"
        FROM products
        WHERE "isActive" = true
          AND "stockQuantity" > 0
        ORDER BY name
        LIMIT 20
      `;

    console.log(`✅ Encontrados ${products.length} produtos`);

    // Converter BigInt para evitar erro de serialização
    const cleanProducts = products.map((p) => ({
      id: String(p.id),
      name: p.name,
      barcode: p.barcode,
      description: p.description,
      stockQuantity: Number(p.stockQuantity),
      salePrice: Number(p.salePrice),
      isActive: Boolean(p.isActive),
    }));

    return NextResponse.json({
      success: true,
      count: cleanProducts.length,
      products: cleanProducts,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar produtos",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
