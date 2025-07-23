"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  Clock,
  Target,
  Calendar,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Timer,
  Crown,
  Percent,
  FileSpreadsheet,
  FileText,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { SimpleChart } from "./SimpleChart"

interface DashboardStat {
  title: string
  value: string
  icon: string
  change: string
  changeType: string
  subtitle?: string
}

interface DashboardAlert {
  type: string
  message: string
}

interface RecentSale {
  id: string
  saleNumber: string
  customerName: string
  total: number
  paymentMethod: string
  status: string
  createdAt: string
  duration?: number
}

interface SalesByDay {
  date: string
  count: number
  total: number
  day: string
}

interface SalesByHour {
  hour: string
  count: number
  total: number
}

interface TopProduct {
  name: string
  quantity: number
  salesCount: number
  stockDays?: number
}

interface TopCustomer {
  name: string
  totalPurchases: number
  lastPurchase: string
  frequency: number
}

interface TopSeller {
  name: string
  sales: number
  total: number
}

interface PaymentMethod {
  method: string
  count: number
  total: number
}

interface ProfitData {
  grossProfit: number
  profitMargin: number
  costOfGoods: number
}

interface ReceivableData {
  amount: number
  daysToReceive: number
  method: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([])
  const [salesByHour, setSalesByHour] = useState<SalesByHour[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [topSellers, setTopSellers] = useState<TopSeller[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [receivables, setReceivables] = useState<ReceivableData[]>([])
  const [averageServiceTime, setAverageServiceTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<"today" | "week" | "month">("today")
  const [showMobileActions, setShowMobileActions] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/dashboard?period=${period}`, {
        credentials: "include",
      })

      const contentType = response.headers.get("content-type") ?? ""

      /**
       * Caso a API responda HTML (ex.: redirecionamento para login ou
       * página de erro do Next) o `.json()` falha com
       * “Unexpected token '<'…”. Verificamos o Content-Type antes.
       */
      if (response.ok && contentType.includes("application/json")) {
        const data = await response.json()

        setStats(data.stats || [])
        setAlerts(data.alerts || [])
        setRecentSales(data.recentSales || [])
        setSalesByDay(data.salesByDay || [])
        setSalesByHour(data.salesByHour || [])
        setTopProducts(data.topProducts || [])
        setTopCustomers(data.topCustomers || [])
        setTopSellers(data.topSellers || [])
        setPaymentMethods(data.paymentMethods || [])
        setProfitData(data.profitData || null)
        setReceivables(data.receivables || [])
        setAverageServiceTime(data.averageServiceTime || 0)
      } else {
        // Se não for JSON, tratamos como erro e exibimos no UI
        const errorText = await response.text()
        setError(
          `Resposta inesperada do servidor (${response.status}): ${errorText.replace(/<[^>]+>/g, "").slice(0, 150)}…`,
        )
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    const icons = {
      DollarSign: DollarSign,
      TrendingUp: TrendingUp,
      Package: Package,
      Users: Users,
      AlertTriangle: AlertTriangle,
      ShoppingCart: ShoppingCart,
      CreditCard: CreditCard,
      Percent: Percent,
      Timer: Timer,
      Target: Target,
    }
    return icons[iconName as keyof typeof icons] || DollarSign
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}min`
  }

  const getTrendIcon = (changeType: string) => {
    if (changeType === "positive") return <ArrowUp className="w-4 h-4 text-green-600" />
    if (changeType === "negative") return <ArrowDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const exportDashboard = async (format: "excel" | "pdf") => {
    try {
      setIsExporting(true)
      setShowMobileActions(false) // Fechar menu mobile após ação

      const response = await fetch(`/api/dashboard/export?format=${format}&period=${period}`, {
        credentials: "include",
      })

      if (response.ok) {
        const blob = await response.blob()

        // Verificar se o blob tem conteúdo
        if (blob.size === 0) {
          throw new Error("Arquivo vazio recebido do servidor")
        }

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `dashboard-${period}-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "csv" : "pdf"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Feedback de sucesso
        alert(`Arquivo ${format.toUpperCase()} baixado com sucesso!`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ${response.status}`)
      }
    } catch (error) {
      console.error("Erro ao exportar:", error)
      alert(`Erro ao exportar ${format.toUpperCase()}: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsExporting(false)
    }
  }

  const sendWhatsAppAlert = async (type: "stock" | "sales") => {
    try {
      await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, period }),
        credentials: "include",
      })
      alert("Alerta enviado via WhatsApp!")
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="mt-3 bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Visão geral do seu negócio em tempo real</p>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "today" | "week" | "month")}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={isExporting}
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => exportDashboard("excel")} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Excel
          </Button>

          <Button variant="outline" size="sm" onClick={() => exportDashboard("pdf")} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            PDF
          </Button>

          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isExporting}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "today" | "week" | "month")}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              disabled={isExporting}
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
            </select>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileActions(!showMobileActions)}
                disabled={isExporting}
              >
                Ações
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>

              {showMobileActions && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[140px]">
                  <button
                    onClick={() => exportDashboard("excel")}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Excel
                  </button>
                  <button
                    onClick={() => exportDashboard("pdf")}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    PDF
                  </button>
                  <button
                    onClick={fetchDashboardData}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center border-t"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = getIcon(stat.icon)
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>}
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(stat.changeType)}
                  <span
                    className={`text-xs font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </CardContent>
              <div
                className={`absolute bottom-0 left-0 h-1 w-full ${
                  stat.changeType === "positive"
                    ? "bg-green-500"
                    : stat.changeType === "negative"
                      ? "bg-red-500"
                      : "bg-gray-300"
                }`}
              />
            </Card>
          )
        })}
      </div>

      {/* Cards de Métricas Avançadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Margem de Lucro */}
        {profitData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Margem de Lucro</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600">{profitData.profitMargin.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">Lucro: {formatCurrency(profitData.grossProfit)}</p>
            </CardContent>
          </Card>
        )}

        {/* Tempo Médio de Atendimento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio/Venda</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{formatTime(averageServiceTime)}</div>
            <p className="text-xs text-gray-500 mt-1">Por atendimento</p>
          </CardContent>
        </Card>

        {/* Recebíveis Futuros */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">A Receber</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-600">
              {formatCurrency(receivables.reduce((sum, r) => sum + r.amount, 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {receivables.length > 0 && `Em ${receivables[0].daysToReceive} dias`}
            </p>
          </CardContent>
        </Card>

        {/* Produtos em Ruptura */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Previsão Ruptura</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-orange-600">
              {topProducts.filter((p) => p.stockDays && p.stockDays <= 7).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Produtos em 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Organizar Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="text-xs md:text-sm">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs md:text-sm">
            Vendas
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs md:text-sm">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs md:text-sm">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs md:text-sm">
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Vendas por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                  Vendas dos Últimos 7 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesByDay.length > 0 ? (
                  <SimpleChart
                    type="line"
                    data={salesByDay.map((day) => ({
                      label: day.day,
                      value: day.total,
                    }))}
                    height={200}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
                )}
              </CardContent>
            </Card>

            {/* Vendas por Hora */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  Vendas por Horário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesByHour.length > 0 ? (
                  <SimpleChart
                    type="bar"
                    data={salesByHour.map((hour) => ({
                      label: hour.hour,
                      value: hour.count,
                      color: "bg-blue-500",
                    }))}
                    height={200}
                  />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Vendas */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Vendas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  Vendas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {recentSales.length > 0 ? (
                    recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">Venda #{String(sale.saleNumber).padStart(4, "0")}</p>
                          <p className="text-sm text-gray-600 truncate">{sale.customerName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {sale.paymentMethod}
                            </Badge>
                            {sale.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {formatTime(sale.duration)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-medium text-green-600">{formatCurrency(sale.total)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhuma venda recente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                  Métodos de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{method.method}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(method.total)}</p>
                          <p className="text-xs text-gray-500">{method.count} vendas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Produtos */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Produtos Mais Vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="w-4 h-4 md:w-5 md:h-5" />
                  Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.salesCount} vendas</p>
                            {product.stockDays && product.stockDays <= 7 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Acaba em {product.stockDays} dias
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-medium">{product.quantity} un</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhum produto vendido</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alertas de Estoque */}
            <Card>
              <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                  Alertas do Sistema
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => sendWhatsAppAlert("stock")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          alert.type === "warning"
                            ? "bg-yellow-50 border-yellow-400"
                            : alert.type === "error"
                              ? "bg-red-50 border-red-400"
                              : "bg-blue-50 border-blue-400"
                        }`}
                      >
                        <p className="text-sm">{alert.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg border-l-4 bg-green-50 border-green-400">
                      <p className="text-sm">✅ Sistema funcionando normalmente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
                Clientes Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-purple-600">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.frequency} compras</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-medium text-purple-600">{formatCurrency(customer.totalPurchases)}</p>
                        <p className="text-xs text-gray-500">
                          Última: {new Date(customer.lastPurchase).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Nenhum cliente frequente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Equipe */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Target className="w-4 h-4 md:w-5 md:h-5" />
                Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {topSellers.length > 0 ? (
                  topSellers.map((seller, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            index === 0
                              ? "bg-yellow-100"
                              : index === 1
                                ? "bg-gray-100"
                                : index === 2
                                  ? "bg-orange-100"
                                  : "bg-blue-100"
                          }`}
                        >
                          <span
                            className={`text-sm font-bold ${
                              index === 0
                                ? "text-yellow-600"
                                : index === 1
                                  ? "text-gray-600"
                                  : index === 2
                                    ? "text-orange-600"
                                    : "text-blue-600"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{seller.name}</p>
                          <p className="text-sm text-gray-600">{seller.sales} vendas</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-medium text-green-600">{formatCurrency(seller.total)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Nenhum vendedor ativo</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
