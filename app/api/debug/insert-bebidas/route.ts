import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("🔍 Inserindo produtos de bebidas...")

    // Verificar se já existem produtos de bebidas
    const existingBebidas = await sql`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE c.name = 'Bebidas'
    `
    
    console.log("🥤 Produtos de bebidas existentes:", existingBebidas[0]?.count)

    // Inserir produtos de bebidas
    const result = await sql`
      INSERT INTO products (
        id,
        name,
        description,
        barcode,
        "categoryId",
        "supplierId",
        "stockQuantity",
        "minStock",
        "maxStock",
        "costPrice",
        "salePrice",
        "isActive",
        status,
        codigo,
        "createdAt",
        "updatedAt"
      ) VALUES 
      ('bebida_002', 'Pepsi 350ml', 'Refrigerante Pepsi lata 350ml', '7891234567890', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dbwz0004csy4rsv3x78c', 30, 10, 100, 2.30, 4.20, true, 'NORMAL', 'BEB002', NOW(), NOW()),
      ('bebida_003', 'Água Mineral 500ml', 'Água mineral natural 500ml', '7891000123456', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dcxj0005csy4vnfdpw6j', 80, 20, 150, 1.00, 2.00, true, 'NORMAL', 'BEB003', NOW(), NOW()),
      ('bebida_004', 'Suco de Laranja 1L', 'Suco de laranja natural 1 litro', '7891234567891', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6ddkb0006csy4rsnssic5', 25, 5, 50, 3.50, 5.90, true, 'NORMAL', 'BEB004', NOW(), NOW()),
      ('bebida_005', 'Guaraná 350ml', 'Refrigerante Guaraná lata 350ml', '7891234567892', 'cmbe6d8z70000csy4ul6a4pfy', 'cmbe6dbwz0004csy4rsv3x78c', 40, 10, 80, 2.20, 4.00, true, 'NORMAL', 'BEB005', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `

    // Verificar produtos de bebidas após inserção
    const bebidasAfter = await sql`
      SELECT 
        p.id,
        p.name,
        p.codigo,
        c.name as category_name,
        p.stock_quantity
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE c.name = 'Bebidas'
      ORDER BY p.name
    `

    console.log("🥤 Produtos de bebidas após inserção:", bebidasAfter.length)

    return NextResponse.json({
      success: true,
      message: "Produtos de bebidas inseridos com sucesso",
      bebidasCount: bebidasAfter.length,
      bebidas: bebidasAfter
    })

  } catch (error) {
    console.error("❌ Erro ao inserir produtos de bebidas:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro ao inserir produtos de bebidas",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      }, 
      { status: 500 }
    )
  }
} 