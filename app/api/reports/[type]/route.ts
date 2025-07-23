import { type NextRequest, NextResponse } from "next/server"
import { mockProducts, mockStockMovements } from "@/app/data/mockData"

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"
    const type = params.type

    // Verificar autenticação
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    // Dados mockados para cada tipo de relatório
    let responseData = {}

    switch (type) {
      case "vendas":
        // Dados de vendas por período
        const salesData = [
          { period: "Jan", vendas: 45000, lucro: 12000 },
          { period: "Fev", vendas: 52000, lucro: 15000 },
          { period: "Mar", vendas: 48000, lucro: 13500 },
          { period: "Abr", vendas: 61000, lucro: 18000 },
          { period: "Mai", vendas: 55000, lucro: 16500 },
          { period: "Jun", vendas: 67000, lucro: 20000 },
          { period: "Jul", vendas: 58000, lucro: 17200 },
          { period: "Ago", vendas: 63000, lucro: 19000 },
          { period: "Set", vendas: 59000, lucro: 17800 },
          { period: "Out", vendas: 64000, lucro: 19500 },
          { period: "Nov", vendas: 68000, lucro: 21000 },
          { period: "Dez", vendas: 72000, lucro: 23000 },
        ]

        // Produtos mais vendidos
        const topProducts = [
          { name: "Coca-Cola 350ml", vendas: 245, receita: 1102.5 },
          { name: "Pão de Açúcar 500g", vendas: 189, receita: 604.8 },
          { name: "Leite Integral 1L", vendas: 156, receita: 904.8 },
          { name: "Arroz Branco 5kg", vendas: 89, receita: 1682.1 },
          { name: "Feijão Preto 1kg", vendas: 78, receita: 741.0 },
          { name: "Açúcar Cristal 1kg", vendas: 67, receita: 321.6 },
          { name: "Café Tradicional 500g", vendas: 62, receita: 868.0 },
          { name: "Óleo de Soja 900ml", vendas: 58, receita: 522.0 },
        ]

        // Filtrar dados por período
        let filteredSalesData = salesData
        if (period === "month") {
          filteredSalesData = salesData.slice(0, 6)
        }

        responseData = {
          salesData: filteredSalesData,
          topProducts,
        }
        break

      case "estoque":
        // Dados de estoque
        const stockData = mockProducts.map((product) => ({
          name: product.name,
          estoque: product.stockQuantity,
          minimo: product.minStock,
          status:
            product.stockQuantity === 0 ? "Esgotado" : product.stockQuantity <= product.minStock ? "Baixo" : "Normal",
        }))

        // Movimentações de estoque
        const stockMovements = mockStockMovements.map((movement) => ({
          productName: mockProducts.find((p) => p.id === movement.productId)?.name || "Produto Desconhecido",
          quantity: movement.quantity,
          type: movement.movementType,
          date: movement.createdAt,
          reason: movement.reason,
        }))

        responseData = {
          stockData,
          stockMovements,
          stats: {
            totalProducts: mockProducts.length,
            lowStockProducts: mockProducts.filter((p) => p.stockQuantity <= p.minStock && p.stockQuantity > 0).length,
            outOfStockProducts: mockProducts.filter((p) => p.stockQuantity === 0).length,
            totalValue: mockProducts.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0),
          },
        }
        break

      case "financeiro":
        // Dados financeiros
        const financialData = [
          { mes: "Janeiro", receita: 45000, despesas: 32000, lucro: 13000 },
          { mes: "Fevereiro", receita: 52000, despesas: 35000, lucro: 17000 },
          { mes: "Março", receita: 48000, despesas: 33000, lucro: 15000 },
          { mes: "Abril", receita: 61000, despesas: 40000, lucro: 21000 },
          { mes: "Maio", receita: 55000, despesas: 37000, lucro: 18000 },
          { mes: "Junho", receita: 67000, despesas: 42000, lucro: 25000 },
        ]

        // Filtrar dados por período
        let filteredFinancialData = financialData
        if (period === "year") {
          // Duplicar dados para simular um ano completo
          filteredFinancialData = [...financialData, ...financialData]
        }

        responseData = {
          financialData: filteredFinancialData,
          summary: {
            totalReceita: filteredFinancialData.reduce((sum, item) => sum + item.receita, 0),
            totalDespesas: filteredFinancialData.reduce((sum, item) => sum + item.despesas, 0),
            totalLucro: filteredFinancialData.reduce((sum, item) => sum + item.lucro, 0),
          },
        }
        break

      case "clientes":
        // Dados de clientes
        const customerData = [
          { nome: "João Silva", compras: 12, valorTotal: 1250.5, ultimaCompra: "15/05/2024" },
          { nome: "Maria Santos", compras: 8, valorTotal: 980.75, ultimaCompra: "22/05/2024" },
          { nome: "Pedro Almeida", compras: 15, valorTotal: 1875.3, ultimaCompra: "10/05/2024" },
          { nome: "Ana Oliveira", compras: 6, valorTotal: 750.2, ultimaCompra: "28/05/2024" },
          { nome: "Carlos Souza", compras: 10, valorTotal: 1120.9, ultimaCompra: "18/05/2024" },
          { nome: "Fernanda Lima", compras: 4, valorTotal: 520.4, ultimaCompra: "30/05/2024" },
        ]

        responseData = {
          customerData,
          summary: {
            totalClientes: customerData.length,
            totalCompras: customerData.reduce((sum, cliente) => sum + cliente.compras, 0),
            valorTotal: customerData.reduce((sum, cliente) => sum + cliente.valorTotal, 0),
          },
        }
        break

      default:
        return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error(`Erro ao buscar relatório ${params.type}:`, error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
