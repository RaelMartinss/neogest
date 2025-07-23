import { NextResponse } from "next/server"
import { getDashboardStats, getSystemAlerts } from "@/lib/dashboard-service"

export async function GET() {
  try {
    console.log("Buscando dados avançados do dashboard...")

    const [statsData, alerts] = await Promise.all([getDashboardStats(), getSystemAlerts()])

    console.log("Dados do dashboard obtidos:", {
      statsData: {
        todaySales: statsData.todaySales,
        monthSales: statsData.monthSales,
        productsInStock: statsData.productsInStock,
        lowStockProducts: statsData.lowStockProducts,
        salesByDayCount: statsData.salesByDay.length,
        topProductsCount: statsData.topProducts.length,
      },
      alertsCount: alerts.length,
    })

    // Formatar stats como array para o componente Dashboard
    const stats = [
      {
        title: "Vendas Hoje",
        value: `R$ ${statsData.todaySales.total.toFixed(2)}`,
        icon: "DollarSign",
        change:
          statsData.todaySales.change > 0
            ? `+${statsData.todaySales.change.toFixed(1)}%`
            : statsData.todaySales.change < 0
              ? `${statsData.todaySales.change.toFixed(1)}%`
              : "0%",
        changeType:
          statsData.todaySales.change > 0 ? "positive" : statsData.todaySales.change < 0 ? "negative" : "neutral",
      },
      {
        title: "Vendas do Mês",
        value: `R$ ${statsData.monthSales.total.toFixed(2)}`,
        icon: "TrendingUp",
        change:
          statsData.monthSales.change > 0
            ? `+${statsData.monthSales.change.toFixed(1)}%`
            : statsData.monthSales.change < 0
              ? `${statsData.monthSales.change.toFixed(1)}%`
              : "0%",
        changeType:
          statsData.monthSales.change > 0 ? "positive" : statsData.monthSales.change < 0 ? "negative" : "neutral",
      },
      {
        title: "Produtos em Estoque",
        value: statsData.productsInStock.toString(),
        icon: "Package",
        change: statsData.lowStockProducts > 0 ? `${statsData.lowStockProducts} baixo` : "OK",
        changeType: statsData.lowStockProducts > 0 ? "negative" : "positive",
      },
      {
        title: "Produtos Sem Estoque",
        value: statsData.outOfStockProducts.toString(),
        icon: "AlertTriangle",
        change: statsData.outOfStockProducts > 0 ? "Atenção!" : "OK",
        changeType: statsData.outOfStockProducts > 0 ? "negative" : "positive",
      },
    ]

    return NextResponse.json({
      stats,
      alerts,
      recentSales: statsData.recentSales,
      salesByDay: statsData.salesByDay,
      topProducts: statsData.topProducts,
      paymentMethods: statsData.paymentMethods,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)

    // Retornar dados padrão em caso de erro
    return NextResponse.json({
      stats: [
        {
          title: "Vendas Hoje",
          value: "R$ 0,00",
          icon: "DollarSign",
          change: "0%",
          changeType: "neutral",
        },
        {
          title: "Vendas do Mês",
          value: "R$ 0,00",
          icon: "TrendingUp",
          change: "0%",
          changeType: "neutral",
        },
        {
          title: "Produtos em Estoque",
          value: "0",
          icon: "Package",
          change: "OK",
          changeType: "positive",
        },
        {
          title: "Produtos Sem Estoque",
          value: "0",
          icon: "AlertTriangle",
          change: "OK",
          changeType: "positive",
        },
      ],
      alerts: [
        {
          type: "info",
          message: "Sistema iniciado com sucesso",
        },
      ],
      recentSales: [],
      salesByDay: [],
      topProducts: [],
      paymentMethods: [],
      timestamp: new Date().toISOString(),
    })
  }
}
