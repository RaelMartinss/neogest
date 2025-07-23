import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function getDashboardStats() {
  try {
    console.log("🔍 Iniciando getDashboardStats avançado...")

    // Vendas de hoje
    const todaySales = await sql`
     SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total), 0) as total 
      FROM 
        sales
      WHERE 
        "created_at" >= date_trunc('day', NOW()) 
        AND "created_at" < date_trunc('day', NOW()) + interval '1 day'
    `

    // Vendas de ontem para comparação
    const yesterdaySales = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE DATE("created_at") = CURRENT_DATE - INTERVAL '1 day'
    `

    // Vendas do mês atual
    const monthSales = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE EXTRACT(MONTH FROM "created_at") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM "created_at") = EXTRACT(YEAR FROM CURRENT_DATE)
    `

    // Vendas do mês passado para comparação
    const lastMonthSales = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE EXTRACT(MONTH FROM "created_at") = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM "created_at") = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    `

    // Produtos em estoque
    const productsInStock = await sql`
      SELECT COUNT(*) as count
      FROM products 
      WHERE "isActive" = true AND "stockQuantity" > 0
    `

    // Produtos com estoque baixo
    const lowStockProducts = await sql`
      SELECT COUNT(*) as count
      FROM products 
      WHERE "isActive" = true AND "stockQuantity" <= "minStock" AND "stockQuantity" > 0
    `

    // Produtos sem estoque
    const outOfStockProducts = await sql`
      SELECT COUNT(*) as count
      FROM products 
      WHERE "isActive" = true AND "stockQuantity" = 0
    `

    // Vendas recentes com mais detalhes
    const recentSales = await sql`
      SELECT 
        s.id,
        s.id as "saleNumber",
        s.total as "totalAmount",
        s."created_at" as "createdAt",
        s."payment_method" as "tipoPagamento",
        s."customer_name" as "customerName",
        s.status
      FROM sales s
      ORDER BY s."created_at" DESC
      LIMIT 5
    `

    // Vendas por dia (últimos 7 dias)
    const salesByDay = await sql`
      SELECT 
        DATE("created_at") as date,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE "created_at" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE("created_at")
      ORDER BY DATE("created_at")
    `

    // Produtos mais vendidos
    const topProducts = await sql`
      SELECT 
        si."product_name",
        SUM(si.quantity) as total_quantity,
        COUNT(DISTINCT si."sale_id") as sales_count
      FROM sale_items si
      JOIN sales s ON s.id = si."sale_id"
      WHERE s."created_at" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY si."product_name"
      ORDER BY total_quantity DESC
      LIMIT 5
    `

    // Métodos de pagamento mais usados
    const paymentMethods = await sql`
      SELECT 
        "payment_method" as "tipoPagamento",
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE "created_at" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "payment_method"
      ORDER BY count DESC
    `

    // Calcular variações percentuais
    const todayTotal = Number(todaySales[0]?.total || 0)
    const yesterdayTotal = Number(yesterdaySales[0]?.total || 0)
    const todayChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0

    const monthTotal = Number(monthSales[0]?.total || 0)
    const lastMonthTotal = Number(lastMonthSales[0]?.total || 0)
    const monthChange = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

    return {
      todaySales: {
        total: todayTotal,
        count: Number(todaySales[0]?.count || 0),
        change: todayChange,
      },
      monthSales: {
        total: monthTotal,
        count: Number(monthSales[0]?.count || 0),
        change: monthChange,
      },
      productsInStock: Number(productsInStock[0]?.count || 0),
      lowStockProducts: Number(lowStockProducts[0]?.count || 0),
      outOfStockProducts: Number(outOfStockProducts[0]?.count || 0),
      recentSales: recentSales.map((sale: any) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        customerName: sale.customerName || "Cliente não informado",
        total: Number(sale.totalAmount),
        paymentMethod: sale.tipoPagamento,
        status: sale.status,
        createdAt: sale.createdAt,
      })),
      salesByDay: salesByDay.map((day: any) => ({
        date: day.date,
        count: Number(day.count),
        total: Number(day.total),
        day: new Date(day.date).toLocaleDateString("pt-BR", { weekday: "short" }),
      })),
      topProducts: topProducts.map((product: any) => ({
        name: product.product_name,
        quantity: Number(product.total_quantity),
        salesCount: Number(product.sales_count),
      })),
      paymentMethods: paymentMethods.map((method: any) => ({
        method: method.paymentMethod,
        count: Number(method.count),
        total: Number(method.total),
      })),
    }
  } catch (error) {
    console.error("❌ Erro detalhado:", error)

    return {
      todaySales: { total: 0, count: 0, change: 0 },
      monthSales: { total: 0, count: 0, change: 0 },
      productsInStock: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      recentSales: [],
      salesByDay: [],
      topProducts: [],
      paymentMethods: [],
    }
  }
}

export async function getSystemAlerts() {
  try {
    const alerts = []

    // Verificar produtos com estoque baixo
    const lowStockProducts = await sql`
      SELECT name, "stockQuantity", "minStock"
      FROM products
      WHERE "stockQuantity" <= "minStock" AND "stockQuantity" > 0 AND "isActive" = true
      LIMIT 10
    `

    lowStockProducts.forEach((product: any) => {
      alerts.push({
        id: `low-stock-${product.name}`,
        type: "warning" as const,
        title: "Estoque Baixo",
        message: `${product.name} tem apenas ${product.stockQuantity} unidades em estoque`,
        timestamp: new Date().toISOString(),
      })
    })

    // Verificar produtos sem estoque
    const outOfStockProducts = await sql`
      SELECT name
      FROM products
      WHERE "stockQuantity" = 0 AND "isActive" = true
      LIMIT 5
    `

    outOfStockProducts.forEach((product: any) => {
      alerts.push({
        id: `out-of-stock-${product.name}`,
        type: "error" as const,
        title: "Produto Sem Estoque",
        message: `${product.name} está sem estoque`,
        timestamp: new Date().toISOString(),
      })
    })

    // Verificar vendas do dia
    const todaySalesCount = await sql`
      SELECT COUNT(*) as count
      FROM sales
      WHERE DATE("created_at") = CURRENT_DATE
    `

    if (Number(todaySalesCount[0]?.count || 0) === 0) {
      alerts.push({
        id: "no-sales-today",
        type: "info" as const,
        title: "Nenhuma Venda Hoje",
        message: "Ainda não foram registradas vendas hoje",
        timestamp: new Date().toISOString(),
      })
    }

    return alerts
  } catch (error) {
    console.error("Erro ao buscar alertas:", error)
    return []
  }
}
