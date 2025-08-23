"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Package,
  Truck,
  DollarSign,
  Users,
  Eye,
  Edit,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import type { Fornecedor, PedidoCompra, Entrega } from "@/lib/purchases-service"
import FornecedorModal from "./FornecedorModal"
import PedidoCompraModal from "./PedidoCompraModal"

interface PurchasesStats {
  pedidos_pendentes: number
  entregas_hoje: number
  valor_total_compras: number
  fornecedores_ativos: number
}

export default function ComprasControl() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  // Estados dos dados
  const [stats, setStats] = useState<PurchasesStats>({
    pedidos_pendentes: 0,
    entregas_hoje: 0,
    valor_total_compras: 0,
    fornecedores_ativos: 0,
  })
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])

  // Estados dos modais
  const [fornecedorModalOpen, setFornecedorModalOpen] = useState(false)
  const [pedidoModalOpen, setPedidoModalOpen] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null)

  // Função para formatar valores monetários com segurança
  const formatCurrency = (value: number | string | null | undefined): string => {
    const numValue = Number(value) || 0
    return numValue.toFixed(2)
  }

  // Função para formatar números com segurança
  const formatNumber = (value: number | string | null | undefined): number => {
    return Number(value) || 0
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadStats()
    loadFornecedores()
    loadPedidos()
    loadEntregas()
  }, [])

  // Recarregar dados quando mudar filtros
  useEffect(() => {
    if (activeTab === "fornecedores") {
      loadFornecedores()
    } else if (activeTab === "pedidos") {
      loadPedidos()
    } else if (activeTab === "entregas") {
      loadEntregas()
    }
  }, [searchTerm, statusFilter, activeTab])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/purchases/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const loadFornecedores = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/fornecedores?${params}`)
      const data = await response.json()
      if (data.success) {
        setFornecedores(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error)
    }
  }

  const loadPedidos = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/pedidos-compra?${params}`)
      const data = await response.json()
      if (data.success) {
        setPedidos(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
    }
  }

  const loadEntregas = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/entregas?${params}`)
      const data = await response.json()
      if (data.success) {
        setEntregas(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar entregas:", error)
    }
  }

  const handleSaveFornecedor = async (fornecedorData: Partial<Fornecedor>) => {
    setIsLoading(true)
    try {
      const url = selectedFornecedor ? `/api/fornecedores/${selectedFornecedor.id}` : "/api/fornecedores"

      const method = selectedFornecedor ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fornecedorData),
      })

      const data = await response.json()
      if (data.success) {
        setFornecedorModalOpen(false)
        setSelectedFornecedor(null)
        loadFornecedores()
        loadStats()
      }
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePedido = async (pedidoData: any) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/pedidos-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      })

      const data = await response.json()
      if (data.success) {
        setPedidoModalOpen(false)
        loadPedidos()
        loadStats()
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePedidoStatus = async (pedidoId: number, status: string) => {
    try {
      const response = await fetch(`/api/pedidos-compra/${pedidoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (data.success) {
        loadPedidos()
        loadStats()
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800"
      case "inativo":
        return "bg-red-100 text-red-800"
      case "bloqueado":
        return "bg-red-100 text-red-800"
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "aprovado":
        return "bg-blue-100 text-blue-800"
      case "enviado":
        return "bg-purple-100 text-purple-800"
      case "entregue":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      case "parcial":
        return "bg-orange-100 text-orange-800"
      case "em_transito":
        return "bg-blue-100 text-blue-800"
      case "atrasado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "entregue":
        return <CheckCircle className="h-4 w-4" />
      case "cancelado":
        return <XCircle className="h-4 w-4" />
      case "pendente":
        return <Clock className="h-4 w-4" />
      case "atrasado":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-gray-600">Gestão de fornecedores e pedidos de compra</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                    <p className="text-2xl font-bold">{stats.pedidos_pendentes}</p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Entregas Hoje</p>
                    <p className="text-2xl font-bold">{stats.entregas_hoje}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor em Compras</p>
                    <p className="text-2xl font-bold">R$ {formatCurrency(stats.valor_total_compras)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fornecedores Ativos</p>
                    <p className="text-2xl font-bold">{stats.fornecedores_ativos}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pedidos.slice(0, 5).map((pedido) => (
                  <div key={pedido.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{pedido.numero}</span>
                        <Badge className={getStatusColor(pedido.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(pedido.status)}
                            {pedido.status}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{pedido.fornecedor_nome}</p>
                      <p className="text-sm text-gray-500">
                        {pedido.data_previsao_entrega &&
                          `Previsão: ${new Date(pedido.data_previsao_entrega).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {formatCurrency(pedido.valor_final)}</p>
                      <p className="text-sm text-gray-600">{pedido.itens_count || 0} itens</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setPedidoModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previsão</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{pedido.numero}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{pedido.fornecedor_nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(pedido.data_pedido).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pedido.data_previsao_entrega
                            ? new Date(pedido.data_previsao_entrega).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">R$ {formatCurrency(pedido.valor_final)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(pedido.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(pedido.status)}
                              {pedido.status}
                            </div>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pedido.status === "pendente" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updatePedidoStatus(pedido.id, "aprovado")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
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

        <TabsContent value="fornecedores" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setFornecedorModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fornecedores.map((fornecedor) => (
              <Card key={fornecedor.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{fornecedor.nome}</CardTitle>
                      <p className="text-sm text-gray-600">{fornecedor.cnpj || fornecedor.cpf}</p>
                    </div>
                    <Badge className={getStatusColor(fornecedor.status)}>{fornecedor.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fornecedor.contato && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{fornecedor.contato}</span>
                      </div>
                    )}
                    {fornecedor.email && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{fornecedor.email}</span>
                      </div>
                    )}
                    {fornecedor.endereco && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{fornecedor.endereco}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setSelectedFornecedor(fornecedor)
                        setFornecedorModalOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Controle de Entregas</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setSearchTerm("")
                  loadEntregas()
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Todas
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setSearchTerm("")
                  fetch("/api/entregas?filter=hoje")
                    .then((res) => res.json())
                    .then((data) => data.success && setEntregas(data.data))
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Hoje
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all")
                  setSearchTerm("")
                  fetch("/api/entregas?filter=atrasadas")
                    .then((res) => res.json())
                    .then((data) => data.success && setEntregas(data.data))
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Atrasadas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregas Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entregas
                    .filter((e) => new Date(e.data_entrega).toDateString() === new Date().toDateString())
                    .slice(0, 3)
                    .map((entrega) => (
                      <div key={entrega.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">{entrega.pedido_numero}</p>
                          <p className="text-sm text-gray-600">{entrega.fornecedor_nome}</p>
                        </div>
                        <Badge className={getStatusColor(entrega.status)}>{entrega.status}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregas Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entregas
                    .filter(
                      (e) =>
                        e.status === "atrasado" ||
                        (e.data_prevista && new Date(e.data_prevista) < new Date() && e.status !== "entregue"),
                    )
                    .slice(0, 3)
                    .map((entrega) => (
                      <div key={entrega.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{entrega.pedido_numero}</p>
                          <p className="text-sm text-gray-600">{entrega.fornecedor_nome}</p>
                          {entrega.data_prevista && (
                            <p className="text-xs text-red-600">
                              Previsto: {new Date(entrega.data_prevista).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-red-100 text-red-800">Atrasado</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entregas
                    .filter((e) => e.data_prevista && new Date(e.data_prevista) > new Date() && e.status !== "entregue")
                    .slice(0, 3)
                    .map((entrega) => (
                      <div key={entrega.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium">{entrega.pedido_numero}</p>
                          <p className="text-sm text-gray-600">{entrega.fornecedor_nome}</p>
                          {entrega.data_prevista && (
                            <p className="text-xs text-yellow-600">
                              {new Date(entrega.data_prevista).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(entrega.status)}>{entrega.status}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <FornecedorModal
        isOpen={fornecedorModalOpen}
        onClose={() => {
          setFornecedorModalOpen(false)
          setSelectedFornecedor(null)
        }}
        onSave={handleSaveFornecedor}
        fornecedor={selectedFornecedor}
        isLoading={isLoading}
      />

      <PedidoCompraModal
        isOpen={pedidoModalOpen}
        onClose={() => setPedidoModalOpen(false)}
        onSave={handleSavePedido}
        fornecedores={fornecedores}
        isLoading={isLoading}
      />
    </div>
  )
}
