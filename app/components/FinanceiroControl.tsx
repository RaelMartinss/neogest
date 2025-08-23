"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  FileSpreadsheet,
  FileIcon as FilePdf,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Receipt,
  Bell,
  Calculator,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
} from "lucide-react"
import { SimpleChart } from "./SimpleChart"

interface ContaFinanceira {
  id: number
  descricao: string
  tipo: "receber" | "pagar"
  categoria: string
  subcategoria?: string
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: "pendente" | "pago" | "vencido" | "cancelado"
  cliente?: string
  fornecedor?: string
  observacoes?: string
  recorrente: boolean
  centroCusto?: string
  numeroDocumento?: string
  formaPagamento?: string
  juros?: number
  multa?: number
  desconto?: number
  valorPago?: number
  createdAt: string
  updatedAt: string
}

interface IndicadorFinanceiro {
  titulo: string
  valor: string
  variacao: number
  tipo: "positivo" | "negativo" | "neutro"
  icone: any
  cor: string
  subtitulo?: string
}

interface MetaFinanceira {
  id: string
  titulo: string
  tipo: "receita" | "despesa" | "economia"
  valorMeta: number
  valorAtual: number
  prazo: string
  status: "atingida" | "em_andamento" | "atrasada"
}

interface CategoriaFinanceira {
  id: string
  nome: string
  tipo: "receber" | "pagar"
  cor: string
  orcamento?: number
  gasto?: number
}

export default function FinanceiroControl() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [indicadores, setIndicadores] = useState<IndicadorFinanceiro[]>([])
  const [metas, setMetas] = useState<MetaFinanceira[]>([])
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [filtros, setFiltros] = useState({
    periodo: "mes",
    categoria: "todas",
    status: "todos",
    tipo: "todos",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showNovaContaModal, setShowNovaContaModal] = useState(false)
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [novaConta, setNovaConta] = useState<Partial<ContaFinanceira>>({
    tipo: "pagar",
    categoria: "",
    recorrente: false,
  })

  useEffect(() => {
    carregarDadosFinanceiros()
  }, [filtros])

  const carregarDadosFinanceiros = async () => {
    setIsLoading(true)
    try {
      // Simular carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Dados mockados para demonstração
      const contasMock: ContaFinanceira[] = [
        {
          id: 1,
          descricao: "Venda - Cupom 001",
          tipo: "receber",
          categoria: "Vendas",
          subcategoria: "Vendas à Vista",
          valor: 1250.5,
          dataVencimento: "2024-12-28",
          status: "pendente",
          cliente: "João Silva Santos",
          recorrente: false,
          centroCusto: "Loja Principal",
          numeroDocumento: "VND-001",
          formaPagamento: "Cartão de Crédito",
          createdAt: "2024-12-26T10:00:00.000Z",
          updatedAt: "2024-12-26T10:00:00.000Z",
        },
        {
          id: 2,
          descricao: "Fornecedor - Confecções Modernas",
          tipo: "pagar",
          categoria: "Fornecedores",
          subcategoria: "Mercadorias",
          valor: 2850.0,
          dataVencimento: "2024-12-30",
          status: "pendente",
          fornecedor: "Confecções Modernas Ltda",
          recorrente: false,
          centroCusto: "Compras",
          numeroDocumento: "NF-12345",
          formaPagamento: "Boleto",
          createdAt: "2024-12-20T14:30:00.000Z",
          updatedAt: "2024-12-20T14:30:00.000Z",
        },
        {
          id: 3,
          descricao: "Aluguel - Janeiro 2025",
          tipo: "pagar",
          categoria: "Despesas Fixas",
          subcategoria: "Aluguel",
          valor: 3200.0,
          dataVencimento: "2025-01-10",
          status: "pendente",
          fornecedor: "Imobiliária Central",
          recorrente: true,
          centroCusto: "Administrativo",
          numeroDocumento: "ALG-2025-01",
          formaPagamento: "Transferência",
          createdAt: "2024-12-15T09:00:00.000Z",
          updatedAt: "2024-12-15T09:00:00.000Z",
        },
        {
          id: 4,
          descricao: "Energia Elétrica - Dezembro",
          tipo: "pagar",
          categoria: "Despesas Fixas",
          subcategoria: "Utilidades",
          valor: 420.0,
          dataVencimento: "2024-12-25",
          dataPagamento: "2024-12-24",
          status: "pago",
          fornecedor: "Companhia Elétrica",
          recorrente: true,
          centroCusto: "Operacional",
          numeroDocumento: "EE-12-2024",
          formaPagamento: "Débito Automático",
          valorPago: 420.0,
          createdAt: "2024-12-01T08:00:00.000Z",
          updatedAt: "2024-12-24T16:30:00.000Z",
        },
        {
          id: 5,
          descricao: "Venda - Cupom 002",
          tipo: "receber",
          categoria: "Vendas",
          subcategoria: "Vendas Parceladas",
          valor: 890.9,
          dataVencimento: "2024-12-20",
          status: "vencido",
          cliente: "Maria Oliveira Costa",
          recorrente: false,
          centroCusto: "Loja Principal",
          numeroDocumento: "VND-002",
          formaPagamento: "Cartão de Crédito",
          juros: 15.5,
          createdAt: "2024-11-20T15:20:00.000Z",
          updatedAt: "2024-12-20T23:59:00.000Z",
        },
        {
          id: 6,
          descricao: "Salários - Dezembro 2024",
          tipo: "pagar",
          categoria: "Folha de Pagamento",
          subcategoria: "Salários",
          valor: 8500.0,
          dataVencimento: "2024-12-30",
          status: "pendente",
          recorrente: true,
          centroCusto: "Recursos Humanos",
          numeroDocumento: "FP-12-2024",
          formaPagamento: "Transferência",
          createdAt: "2024-12-01T10:00:00.000Z",
          updatedAt: "2024-12-01T10:00:00.000Z",
        },
        {
          id: 7,
          descricao: "Impostos - Simples Nacional",
          tipo: "pagar",
          categoria: "Impostos",
          subcategoria: "Simples Nacional",
          valor: 1250.0,
          dataVencimento: "2025-01-20",
          status: "pendente",
          recorrente: true,
          centroCusto: "Fiscal",
          numeroDocumento: "DAS-01-2025",
          formaPagamento: "Débito Automático",
          createdAt: "2024-12-01T12:00:00.000Z",
          updatedAt: "2024-12-01T12:00:00.000Z",
        },
        {
          id: 8,
          descricao: "Venda - Cupom 003",
          tipo: "receber",
          categoria: "Vendas",
          subcategoria: "Vendas à Vista",
          valor: 329.8,
          dataVencimento: "2024-12-26",
          dataPagamento: "2024-12-26",
          status: "pago",
          cliente: "Carlos Eduardo Pereira",
          recorrente: false,
          centroCusto: "Loja Principal",
          numeroDocumento: "VND-003",
          formaPagamento: "PIX",
          valorPago: 329.8,
          createdAt: "2024-12-26T09:45:00.000Z",
          updatedAt: "2024-12-26T09:45:00.000Z",
        },
      ]

      const indicadoresMock: IndicadorFinanceiro[] = [
        {
          titulo: "Saldo Atual",
          valor: "R$ 15.420,30",
          variacao: 12.5,
          tipo: "positivo",
          icone: DollarSign,
          cor: "green",
          subtitulo: "Disponível em caixa",
        },
        {
          titulo: "A Receber (30 dias)",
          valor: "R$ 8.950,40",
          variacao: 8.3,
          tipo: "positivo",
          icone: TrendingUp,
          cor: "blue",
          subtitulo: "Próximos 30 dias",
        },
        {
          titulo: "A Pagar (30 dias)",
          valor: "R$ 16.220,00",
          variacao: -5.2,
          tipo: "negativo",
          icone: TrendingDown,
          cor: "red",
          subtitulo: "Próximos 30 dias",
        },
        {
          titulo: "Índice de Liquidez",
          valor: "1.85",
          variacao: 15.8,
          tipo: "positivo",
          icone: Activity,
          cor: "purple",
          subtitulo: "Capacidade de pagamento",
        },
        {
          titulo: "Ticket Médio",
          valor: "R$ 156,80",
          variacao: 3.2,
          tipo: "positivo",
          icone: Receipt,
          cor: "orange",
          subtitulo: "Por venda",
        },
        {
          titulo: "Margem de Lucro",
          valor: "32.5%",
          variacao: 2.1,
          tipo: "positivo",
          icone: Percent,
          cor: "teal",
          subtitulo: "Margem bruta",
        },
      ]

      const metasMock: MetaFinanceira[] = [
        {
          id: "M001",
          titulo: "Reduzir Despesas Fixas",
          tipo: "economia",
          valorMeta: 2000,
          valorAtual: 1200,
          prazo: "2025-03-31",
          status: "em_andamento",
        },
        {
          id: "M002",
          titulo: "Aumentar Receita Mensal",
          tipo: "receita",
          valorMeta: 25000,
          valorAtual: 28500,
          prazo: "2024-12-31",
          status: "atingida",
        },
        {
          id: "M003",
          titulo: "Controlar Gastos com Fornecedores",
          tipo: "despesa",
          valorMeta: 15000,
          valorAtual: 18200,
          prazo: "2025-01-31",
          status: "atrasada",
        },
      ]

      const categoriasMock: CategoriaFinanceira[] = [
        { id: "CAT001", nome: "Vendas", tipo: "receber", cor: "#10B981", orcamento: 30000, gasto: 28500 },
        { id: "CAT002", nome: "Fornecedores", tipo: "pagar", cor: "#EF4444", orcamento: 15000, gasto: 18200 },
        { id: "CAT003", nome: "Despesas Fixas", tipo: "pagar", cor: "#F59E0B", orcamento: 8000, gasto: 7620 },
        { id: "CAT004", nome: "Folha de Pagamento", tipo: "pagar", cor: "#8B5CF6", orcamento: 10000, gasto: 8500 },
        { id: "CAT005", nome: "Impostos", tipo: "pagar", cor: "#6B7280", orcamento: 3000, gasto: 2750 },
      ]

      setContas(contasMock)
      setIndicadores(indicadoresMock)
      setMetas(metasMock)
      setCategorias(categoriasMock)
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "pago":
        return "bg-green-100 text-green-800"
      case "vencido":
        return "bg-red-100 text-red-800"
      case "cancelado":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTipoColor = (tipo: string) => {
    return tipo === "receber" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getVariacaoIcon = (tipo: string) => {
    if (tipo === "positivo") return <ArrowUpRight className="w-4 h-4 text-green-600" />
    if (tipo === "negativo") return <ArrowDownRight className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const filteredContas = contas.filter((conta) => {
    const matchesSearch =
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conta.cliente && conta.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conta.fornecedor && conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategoria = filtros.categoria === "todas" || conta.categoria === filtros.categoria
    const matchesStatus = filtros.status === "todos" || conta.status === filtros.status
    const matchesTipo = filtros.tipo === "todos" || conta.tipo === filtros.tipo

    return matchesSearch && matchesCategoria && matchesStatus && matchesTipo
  })

  const totalReceber = contas
    .filter((c) => c.tipo === "receber" && c.status !== "cancelado")
    .reduce((acc, c) => acc + c.valor, 0)
  const totalPagar = contas
    .filter((c) => c.tipo === "pagar" && c.status !== "cancelado")
    .reduce((acc, c) => acc + c.valor, 0)
  const saldoLiquido = totalReceber - totalPagar
  const contasVencidas = contas.filter((c) => c.status === "vencido").length
  const contasVencendoHoje = contas.filter((c) => {
    const hoje = new Date().toISOString().split("T")[0]
    return c.dataVencimento === hoje && c.status === "pendente"
  }).length

  const salvarNovaConta = async () => {
    try {
      // Simular salvamento
      const novaContaCompleta: ContaFinanceira = {
        ...novaConta,
        id: Date.now(),
        status: "pendente",
        recorrente: novaConta.recorrente || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as ContaFinanceira

      setContas([...contas, novaContaCompleta])
      setShowNovaContaModal(false)
      setNovaConta({ tipo: "pagar", categoria: "", recorrente: false })
    } catch (error) {
      console.error("Erro ao salvar conta:", error)
    }
  }

  const marcarComoPago = async (contaId: number) => {
    try {
      setContas(
        contas.map((conta) =>
          conta.id === contaId
            ? {
                ...conta,
                status: "pago" as const,
                dataPagamento: new Date().toISOString().split("T")[0],
                valorPago: conta.valor,
                updatedAt: new Date().toISOString(),
              }
            : conta,
        ),
      )
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
    }
  }

  const exportarRelatorio = async (formato: "excel" | "pdf") => {
    try {
      // Simular exportação
      alert(`Relatório ${formato.toUpperCase()} exportado com sucesso!`)
    } catch (error) {
      console.error("Erro ao exportar:", error)
    }
  }

  // Dados para gráficos
  const dadosFluxoCaixa = [
    { mes: "Set", entradas: 25000, saidas: 18000 },
    { mes: "Out", entradas: 28000, saidas: 19500 },
    { mes: "Nov", entradas: 32000, saidas: 21000 },
    { mes: "Dez", entradas: 35000, saidas: 22500 },
  ]

  const dadosCategorias = categorias.map((cat) => ({
    label: cat.nome,
    value: cat.gasto || 0,
    color: cat.cor,
  }))

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        <span>Carregando dados financeiros...</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-sm md:text-base text-gray-600">
            Controle completo das suas finanças com indicadores avançados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportarRelatorio("excel")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportarRelatorio("pdf")}>
            <FilePdf className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={carregarDadosFinanceiros}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros e Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={filtros.periodo} onValueChange={(value) => setFiltros({ ...filtros, periodo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={filtros.categoria} onValueChange={(value) => setFiltros({ ...filtros, categoria: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Vendas">Vendas</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="Despesas Fixas">Despesas Fixas</SelectItem>
                  <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
                  <SelectItem value="Impostos">Impostos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receber">A Receber</SelectItem>
                  <SelectItem value="pagar">A Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 text-xs md:text-sm">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="metas">Metas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Dashboard Financeiro */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Indicadores Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {indicadores.map((indicador, index) => {
              const Icon = indicador.icone
              return (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium text-gray-600">{indicador.titulo}</p>
                        <p className="text-lg md:text-2xl font-bold truncate">{indicador.valor}</p>
                        {indicador.subtitulo && <p className="text-xs text-gray-500 mt-1">{indicador.subtitulo}</p>}
                        <div className="flex items-center gap-1 mt-2">
                          {getVariacaoIcon(indicador.tipo)}
                          <span
                            className={`text-xs font-medium ${
                              indicador.tipo === "positivo"
                                ? "text-green-600"
                                : indicador.tipo === "negativo"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {indicador.variacao > 0 ? "+" : ""}
                            {indicador.variacao}%
                          </span>
                        </div>
                      </div>
                      <Icon className={`h-6 w-6 md:h-8 md:w-8 text-${indicador.cor}-600 flex-shrink-0`} />
                    </div>
                  </CardContent>
                  <div className={`absolute bottom-0 left-0 h-1 w-full bg-${indicador.cor}-500`} />
                </Card>
              )
            })}
          </div>

          {/* Alertas e Notificações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Alertas Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contasVencendoHoje > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800">{contasVencendoHoje} conta(s) vencendo hoje</p>
                        <p className="text-sm text-yellow-600">Verifique as contas que precisam ser pagas hoje</p>
                      </div>
                    </div>
                  )}

                  {contasVencidas > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">{contasVencidas} conta(s) em atraso</p>
                        <p className="text-sm text-red-600">Contas vencidas que precisam de atenção imediata</p>
                      </div>
                    </div>
                  )}

                  {saldoLiquido < 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Saldo negativo projetado</p>
                        <p className="text-sm text-red-600">
                          Déficit de{" "}
                          {Math.abs(saldoLiquido).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {contasVencendoHoje === 0 && contasVencidas === 0 && saldoLiquido >= 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">Situação financeira estável</p>
                        <p className="text-sm text-green-600">Nenhum alerta crítico no momento</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                  Resumo Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Recebido</span>
                    <span className="font-medium text-green-600">
                      {contas
                        .filter((c) => c.tipo === "receber" && c.status === "pago")
                        .reduce((acc, c) => acc + (c.valorPago || c.valor), 0)
                        .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Pago</span>
                    <span className="font-medium text-red-600">
                      {contas
                        .filter((c) => c.tipo === "pagar" && c.status === "pago")
                        .reduce((acc, c) => acc + (c.valorPago || c.valor), 0)
                        .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Saldo do Mês</span>
                    <span className={`font-bold ${saldoLiquido >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {saldoLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Fluxo de Caixa (4 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  type="bar"
                  data={dadosFluxoCaixa.map((item) => ({
                    label: item.mes,
                    value: item.entradas - item.saidas,
                    color: item.entradas > item.saidas ? "#10B981" : "#EF4444",
                  }))}
                  height={250}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Gastos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart type="pie" data={dadosCategorias} height={250} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* A Receber */}
        <TabsContent value="receber" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 sm:max-w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar contas a receber..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={showNovaContaModal} onOpenChange={setShowNovaContaModal}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setNovaConta({ ...novaConta, tipo: "receber" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Conta a Receber</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={novaConta.descricao || ""}
                      onChange={(e) => setNovaConta({ ...novaConta, descricao: e.target.value })}
                      placeholder="Ex: Venda - Cupom 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={novaConta.valor || ""}
                      onChange={(e) => setNovaConta({ ...novaConta, valor: Number.parseFloat(e.target.value) })}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={novaConta.categoria || ""}
                      onValueChange={(value) => setNovaConta({ ...novaConta, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vendas">Vendas</SelectItem>
                        <SelectItem value="Serviços">Serviços</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={novaConta.dataVencimento || ""}
                      onChange={(e) => setNovaConta({ ...novaConta, dataVencimento: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={novaConta.cliente || ""}
                      onChange={(e) => setNovaConta({ ...novaConta, cliente: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={novaConta.observacoes || ""}
                      onChange={(e) => setNovaConta({ ...novaConta, observacoes: e.target.value })}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={salvarNovaConta} className="flex-1">
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setShowNovaContaModal(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descrição
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                        Cliente
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                        Vencimento
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredContas
                      .filter((conta) => conta.tipo === "receber")
                      .map((conta) => (
                        <tr key={conta.id} className="hover:bg-gray-50">
                          <td className="px-3 md:px-6 py-4">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{conta.descricao}</p>
                              <p className="text-xs text-gray-600 truncate">{conta.categoria}</p>
                              {conta.recorrente && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Recorrente
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                            <span className="text-sm truncate">{conta.cliente || "-"}</span>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div>
                              <span className="font-medium text-sm">
                                {conta.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                              {conta.juros && conta.juros > 0 && (
                                <p className="text-xs text-red-600">
                                  +{conta.juros.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} juros
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 hidden md:table-cell text-sm">
                            {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <Badge className={`${getStatusColor(conta.status)} text-xs`}>{conta.status}</Badge>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="flex gap-1 md:gap-2">
                              {conta.status === "pendente" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => marcarComoPago(conta.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A Pagar */}
        <TabsContent value="pagar" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 sm:max-w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar contas a pagar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={showNovaContaModal} onOpenChange={setShowNovaContaModal}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setNovaConta({ ...novaConta, tipo: "pagar" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descrição
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                        Fornecedor
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                        Vencimento
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredContas
                      .filter((conta) => conta.tipo === "pagar")
                      .map((conta) => (
                        <tr key={conta.id} className="hover:bg-gray-50">
                          <td className="px-3 md:px-6 py-4">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{conta.descricao}</p>
                              <p className="text-xs text-gray-600 truncate">{conta.categoria}</p>
                              {conta.recorrente && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Recorrente
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                            <span className="text-sm truncate">{conta.fornecedor || "-"}</span>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div>
                              <span className="font-medium text-sm">
                                {conta.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                              {conta.multa && conta.multa > 0 && (
                                <p className="text-xs text-red-600">
                                  +{conta.multa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} multa
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 hidden md:table-cell text-sm">
                            {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <Badge className={`${getStatusColor(conta.status)} text-xs`}>{conta.status}</Badge>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="flex gap-1 md:gap-2">
                              {conta.status === "pendente" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => marcarComoPago(conta.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fluxo de Caixa */}
        <TabsContent value="fluxo" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Entradas Previstas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {totalReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Próximos 30 dias</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Saídas Previstas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                    {totalPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Próximos 30 dias</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Saldo Projetado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p
                    className={`text-2xl md:text-3xl font-bold ${saldoLiquido >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    {saldoLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{saldoLiquido >= 0 ? "Superávit" : "Déficit"} projetado</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <LineChart className="w-5 h-5 text-purple-600" />
                Evolução do Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart
                type="line"
                data={dadosFluxoCaixa.map((item) => ({
                  label: item.mes,
                  value: item.entradas - item.saidas,
                }))}
                height={300}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Entradas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  type="bar"
                  data={dadosFluxoCaixa.map((item) => ({
                    label: item.mes,
                    value: item.entradas,
                    color: "#10B981",
                  }))}
                  height={250}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Saídas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  type="bar"
                  data={dadosFluxoCaixa.map((item) => ({
                    label: item.mes,
                    value: item.saidas,
                    color: "#EF4444",
                  }))}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metas Financeiras */}
        <TabsContent value="metas" className="space-y-4 md:space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Metas Financeiras</h2>
              <p className="text-gray-600">Acompanhe o progresso das suas metas</p>
            </div>
            <Dialog open={showMetaModal} onOpenChange={setShowMetaModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Meta Financeira</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título da Meta</Label>
                    <Input placeholder="Ex: Reduzir despesas em 10%" />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Aumentar Receita</SelectItem>
                        <SelectItem value="despesa">Controlar Despesas</SelectItem>
                        <SelectItem value="economia">Economia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor da Meta</Label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input type="date" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1">Criar Meta</Button>
                    <Button variant="outline" onClick={() => setShowMetaModal(false)} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {metas.map((meta) => {
              const progresso = (meta.valorAtual / meta.valorMeta) * 100
              const statusColor = meta.status === "atingida" ? "green" : meta.status === "em_andamento" ? "blue" : "red"

              return (
                <Card key={meta.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{meta.titulo}</CardTitle>
                      <Badge className={`bg-${statusColor}-100 text-${statusColor}-800`}>
                        {meta.status === "atingida"
                          ? "Atingida"
                          : meta.status === "em_andamento"
                            ? "Em Andamento"
                            : "Atrasada"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{Math.min(progresso, 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${statusColor}-500 h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(progresso, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>
                          Atual: {meta.valorAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <span>
                          Meta: {meta.valorMeta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Prazo: {new Date(meta.prazo).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  Contas a Pagar vs Receber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Relatório comparativo das contas a pagar e receber por período
                </p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("excel")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FilePdf className="w-5 h-5 text-red-600" />
                  Fluxo de Caixa Detalhado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Análise completa do fluxo de caixa com projeções</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("pdf")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Análise por Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Breakdown detalhado dos gastos por categoria</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("excel")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Relatório de Metas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Acompanhamento do progresso das metas financeiras</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("pdf")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LineChart className="w-5 h-5 text-orange-600" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Gráfico de evolução mês a mês das finanças</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("excel")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="w-5 h-5 text-teal-600" />
                  Indicadores Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Relatório completo com todos os indicadores</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => exportarRelatorio("pdf")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resumo dos Relatórios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-blue-600" />
                Resumo Executivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Recebido</p>
                  <p className="text-xl font-bold text-green-600">
                    {contas
                      .filter((c) => c.tipo === "receber" && c.status === "pago")
                      .reduce((acc, c) => acc + (c.valorPago || c.valor), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Pago</p>
                  <p className="text-xl font-bold text-red-600">
                    {contas
                      .filter((c) => c.tipo === "pagar" && c.status === "pago")
                      .reduce((acc, c) => acc + (c.valorPago || c.valor), 0)
                      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Contas Pendentes</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {contas.filter((c) => c.status === "pendente").length}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo Atual</p>
                  <p className={`text-xl font-bold ${saldoLiquido >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {saldoLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
