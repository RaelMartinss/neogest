"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Target,
  Zap,
  PieChart,
} from "lucide-react"

interface StockStats {
  general: {
    totalProducts: number
    activeProducts: number
    inactiveProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    normalStockProducts: number
  }
  financial: {
    totalCostValue: number
    totalSaleValue: number
    avgCostPrice: number
    avgSalePrice: number
    availableStockValue: number
    potentialProfit: number
  }
  categories: Array<{
    categoryName: string
    productCount: number
    totalQuantity: number
    categoryValue: number
    lowStockCount: number
    outOfStockCount: number
  }>
  units: Array<{
    code: string
    unitName: string
    productCount: number
    totalQuantity: number
    unitValue: number
  }>
  topValueProducts: Array<{
    codigo: string
    name: string
    stockQuantity: number
    costPrice: number
    salePrice: number
    stockValue: number
    unitName: string
    categoryName: string
  }>
  criticalStock: Array<{
    codigo: string
    name: string
    stockQuantity: number
    minStock: number
    maxStock: number
    costPrice: number
    salePrice: number
    unitName: string
    categoryName: string
    statusEstoque: string
  }>
}

export default function StockStatsPanel() {
  const [stats, setStats] = useState<StockStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/products/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setLastUpdate(new Date().toLocaleString("pt-BR"))
      } else {
        console.error("Erro ao carregar estatísticas:", data.error)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "SEM_ESTOQUE":
        return "destructive"
      case "ESTOQUE_BAIXO":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case "SEM_ESTOQUE":
        return "Sem Estoque"
      case "ESTOQUE_BAIXO":
        return "Estoque Baixo"
      default:
        return "Normal"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Estatísticas de Estoque</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar estatísticas</p>
        <Button onClick={loadStats} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Estatísticas de Estoque</h2>
          <p className="text-gray-600">Última atualização: {lastUpdate}</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.general.totalProducts)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(stats.general.activeProducts)} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(stats.general.lowStockProducts + stats.general.outOfStockProducts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.general.outOfStockProducts)} sem estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.financial.availableStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">Valor disponível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.financial.potentialProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Margem:{" "}
              {stats.financial.totalSaleValue > 0
                ? ((stats.financial.potentialProfit / stats.financial.totalSaleValue) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Financeiras Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Valor Total (Custo):</span>
              <span className="font-medium">{formatCurrency(stats.financial.totalCostValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor Total (Venda):</span>
              <span className="font-medium">{formatCurrency(stats.financial.totalSaleValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Preço Médio (Custo):</span>
              <span className="font-medium">{formatCurrency(stats.financial.avgCostPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Preço Médio (Venda):</span>
              <span className="font-medium">{formatCurrency(stats.financial.avgSalePrice)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold">
                <span>Lucro Potencial:</span>
                <span className="text-green-600">{formatCurrency(stats.financial.potentialProfit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Status do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Estoque Normal:</span>
              <Badge variant="default">{formatNumber(stats.general.normalStockProducts)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Estoque Baixo:</span>
              <Badge variant="secondary">{formatNumber(stats.general.lowStockProducts)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Sem Estoque:</span>
              <Badge variant="destructive">{formatNumber(stats.general.outOfStockProducts)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Produtos Ativos:</span>
              <Badge variant="outline">{formatNumber(stats.general.activeProducts)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Produtos Inativos:</span>
              <Badge variant="outline">{formatNumber(stats.general.inactiveProducts)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Produtos por Valor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Top 10 Produtos por Valor em Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Estoque</th>
                  <th className="text-left p-2">Preço Custo</th>
                  <th className="text-left p-2">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.topValueProducts.map((product, index) => (
                  <tr key={product.codigo} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{product.codigo}</td>
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{product.categoryName}</td>
                    <td className="p-2">
                      {formatNumber(product.stockQuantity)} {product.unitName}
                    </td>
                    <td className="p-2">{formatCurrency(product.costPrice)}</td>
                    <td className="p-2 font-bold text-green-600">{formatCurrency(product.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Produtos com Estoque Crítico */}
      {stats.criticalStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Produtos com Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Produto</th>
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2">Estoque Atual</th>
                    <th className="text-left p-2">Estoque Mín.</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.criticalStock.map((product) => (
                    <tr key={product.codigo} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono">{product.codigo}</td>
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.categoryName}</td>
                      <td className="p-2">
                        {formatNumber(product.stockQuantity)} {product.unitName}
                      </td>
                      <td className="p-2">
                        {formatNumber(product.minStock)} {product.unitName}
                      </td>
                      <td className="p-2">
                        <Badge variant={getStockStatusColor(product.statusEstoque)}>
                          {getStockStatusText(product.statusEstoque)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas por Categoria */}
      {stats.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Estatísticas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Categoria</th>
                    <th className="text-left p-2">Produtos</th>
                    <th className="text-left p-2">Quantidade Total</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Críticos</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.categories.map((category) => (
                    <tr key={category.categoryName} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{category.categoryName}</td>
                      <td className="p-2">{formatNumber(category.productCount)}</td>
                      <td className="p-2">{formatNumber(category.totalQuantity)}</td>
                      <td className="p-2">{formatCurrency(category.categoryValue)}</td>
                      <td className="p-2">
                        {category.lowStockCount + category.outOfStockCount > 0 && (
                          <Badge variant="secondary">
                            {formatNumber(category.lowStockCount + category.outOfStockCount)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
