import { type NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Digite pelo menos 2 caracteres para buscar",
      });
    }

    console.log("Buscando produtos com query:", query);

    // Busca por código exato primeiro
    let products = await sql`
      SELECT 
        id,
        codigo as code,
        barcode as barcode,
        name as name,
        cost_price as price,
        stock_quantity as stock,
        unit as unit,
        category_id,
        is_active as active
      FROM products 
      WHERE is_active = true 
        AND (
          codigo = ${query}
          OR barcode = ${query}
        )
      ORDER BY 
        CASE 
          WHEN codigo = ${query} THEN 1
          WHEN barcode = ${query} THEN 2
          ELSE 3
        END
      LIMIT ${limit}
    `;
    console.log("Produtos encontrados por código:", products);
    // Se não encontrou por código exato, busca por nome
    if (products.length === 0) {
      products = await sql`
        SELECT 
          id,
          codigo as code,
          barcode as barcode,
          name as name,
          cost_price as price,
          stock_quantity as stock,
          unit as unit,
          category_id,
          is_active as active
        FROM products 
        WHERE is_active = true 
          AND LOWER(name) LIKE LOWER(${"%" + query + "%"})
        ORDER BY 
          CASE 
            WHEN LOWER(name) LIKE LOWER(${query + "%"}) THEN 1
            WHEN LOWER(name) LIKE LOWER(${"%" + query + "%"}) THEN 2
            ELSE 3
          END,
          name
        LIMIT ${limit}
      `;
    }

    const formattedProducts = products.map((product: any) => ({
      id: String(product.id),
      code: product.code,
      barcode: product.barcode,
      name: product.name,
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      unit: product.unit || "UN",
      category: product.categoria,
      active: Boolean(product.active),
    }));

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    console.error("Erro na busca de produtos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        data: [],
      },
      { status: 500 }
    );
  }
}
