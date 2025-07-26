import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Estatísticas gerais de produtos
    const generalStats = await sql`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_products,
        SUM(CASE WHEN stock_quantity <= min_stock AND stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock_products,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
        SUM(CASE WHEN stock_quantity > min_stock THEN 1 ELSE 0 END) as normal_stock_products
      FROM products
    `

    // Valores financeiros do estoque
    const financialStats = await sql`
      SELECT
        COALESCE(SUM(stock_quantity * cost_price), 0) as total_cost_value,
        COALESCE(SUM(stock_quantity * sale_price), 0) as total_sale_value,
        COALESCE(AVG(cost_price), 0) as avg_cost_price,
        COALESCE(AVG(sale_price), 0) as avg_sale_price,
        COALESCE(SUM(CASE WHEN stock_quantity > 0 THEN stock_quantity * cost_price ELSE 0 END), 0) as available_stock_value
      FROM products
      WHERE is_active = true
    `

    // Estatísticas por categoria
    const categoryStats = await sql`
      SELECT
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity) as total_quantity,
        COALESCE(SUM(p.stock_quantity * p.cost_price), 0) as category_value,
        SUM(CASE WHEN p.stock_quantity <= p.min_stock AND p.stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN p.stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      GROUP BY c.id, c.name
      ORDER BY category_value DESC
    `

    // Estatísticas por unidade de medida
    const unitStats = await sql`
      SELECT
        u.code,
        u.name as unit_name,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity) as total_quantity,
        COALESCE(SUM(p.stock_quantity * p.cost_price), 0) as unit_value
      FROM products p
      LEFT JOIN units u ON p.unit = u.code
      WHERE p.is_active = true
      GROUP BY u.code, u.name
      ORDER BY product_count DESC
    `

    // Top 10 produtos com maior valor em estoque
    const topValueProducts = await sql`
      SELECT
        p.codigo,
        p.name,
        p.stock_quantity,
        p.cost_price,
        p.sale_price,
        (p.stock_quantity * p.cost_price) as stock_value,
        u.name as unit_name,
        c.name as category_name
      FROM products p
      LEFT JOIN units u ON p.unit = u.code
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.stock_quantity > 0
      ORDER BY stock_value DESC
      LIMIT 10
    `

    // Produtos com estoque crítico (abaixo do mínimo)
    const criticalStockProducts = await sql`
      SELECT
        p.codigo,
        p.name,
        p.stock_quantity,
        p.min_stock,
        p.max_stock,
        p.cost_price,
        p.sale_price,
        u.name as unit_name,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'SEM_ESTOQUE'
          WHEN p.stock_quantity <= p.min_stock THEN 'ESTOQUE_BAIXO'
          ELSE 'NORMAL'
        END as status_estoque
      FROM products p
      LEFT JOIN units u ON p.unit = u.code
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true 
        AND p.stock_quantity <= p.min_stock
      ORDER BY 
        CASE 
          WHEN p.stock_quantity = 0 THEN 1
          ELSE 2
        END,
        p.stock_quantity ASC
    `

    // Movimentações recentes (se a tabela existir)
    let recentMovements = []
    try {
      recentMovements = await sql`
        SELECT
          sm.id,
          sm.movement_type,
          sm.quantity,
          sm.reason,
          sm.created_at,
          p.codigo,
          p.name as product_name,
          u.name as unit_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN units u ON p.unit = u.code
        ORDER BY sm.created_at DESC
        LIMIT 20
      `
    } catch (error) {
      console.log("Tabela stock_movements não existe ainda")
    }

    // Normalizar dados
    const stats = {
      general: {
        totalProducts: Number(generalStats[0].total_products) || 0,
        activeProducts: Number(generalStats[0].active_products) || 0,
        inactiveProducts: Number(generalStats[0].inactive_products) || 0,
        lowStockProducts: Number(generalStats[0].low_stock_products) || 0,
        outOfStockProducts: Number(generalStats[0].out_of_stock_products) || 0,
        normalStockProducts: Number(generalStats[0].normal_stock_products) || 0,
      },
      financial: {
        totalCostValue: Number(financialStats[0].total_cost_value) || 0,
        totalSaleValue: Number(financialStats[0].total_sale_value) || 0,
        avgCostPrice: Number(financialStats[0].avg_cost_price) || 0,
        avgSalePrice: Number(financialStats[0].avg_sale_price) || 0,
        availableStockValue: Number(financialStats[0].available_stock_value) || 0,
        potentialProfit:
          (Number(financialStats[0].total_sale_value) || 0) - (Number(financialStats[0].total_cost_value) || 0),
      },
      categories: categoryStats.map((cat: any) => ({
        categoryName: cat.category_name || "Sem categoria",
        productCount: Number(cat.product_count) || 0,
        totalQuantity: Number(cat.total_quantity) || 0,
        categoryValue: Number(cat.category_value) || 0,
        lowStockCount: Number(cat.low_stock_count) || 0,
        outOfStockCount: Number(cat.out_of_stock_count) || 0,
      })),
      units: unitStats.map((unit: any) => ({
        code: unit.code || "UN",
        unitName: unit.unit_name || "Unidade",
        productCount: Number(unit.product_count) || 0,
        totalQuantity: Number(unit.total_quantity) || 0,
        unitValue: Number(unit.unit_value) || 0,
      })),
      topValueProducts: topValueProducts.map((prod: any) => ({
        codigo: prod.codigo,
        name: prod.name,
        stockQuantity: Number(prod.stock_quantity) || 0,
        costPrice: Number(prod.cost_price) || 0,
        salePrice: Number(prod.sale_price) || 0,
        stockValue: Number(prod.stock_value) || 0,
        unitName: prod.unit_name || "Unidade",
        categoryName: prod.category_name || "Sem categoria",
      })),
      criticalStock: criticalStockProducts.map((prod: any) => ({
        codigo: prod.codigo,
        name: prod.name,
        stockQuantity: Number(prod.stock_quantity) || 0,
        minStock: Number(prod.min_stock) || 0,
        maxStock: Number(prod.max_stock) || 0,
        costPrice: Number(prod.cost_price) || 0,
        salePrice: Number(prod.sale_price) || 0,
        unitName: prod.unit_name || "Unidade",
        categoryName: prod.category_name || "Sem categoria",
        statusEstoque: prod.status_estoque,
      })),
      recentMovements: recentMovements.map((mov: any) => ({
        id: String(mov.id),
        movementType: mov.movement_type,
        quantity: Number(mov.quantity) || 0,
        reason: mov.reason,
        createdAt: mov.created_at,
        productCode: mov.codigo,
        productName: mov.product_name,
        unitName: mov.unit_name || "Unidade",
      })),
    }

    return NextResponse.json({
      success: true,
      stats,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao calcular estatísticas de estoque:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        stats: null,
      },
      { status: 500 },
    )
  }
}
