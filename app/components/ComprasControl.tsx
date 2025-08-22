"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Filter,
  Package,
  Truck,
  DollarSign,
  Users,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
} from "lucide-react"

interface Fornecedor {
  id: number
  nome: string
  cnpj: string
  contato: string
  email: string
  telefone: string
  endereco: string
  status: "ativo" | "inativo"
}

interface PedidoCompra {
  id: number
  numero: string
  fornecedor: string
  data: string
  previsaoEntrega: string
  valor: number
  status: "pendente" | "aprovado" | "entregue" | "cancelado"
  itens: number
}

export default function ComprasControl() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])

  useEffect(() => {
    // Mock data para fornecedores
    setFornecedores([
      {
        id: 1,
        nome: "Distribuidora ABC Ltda",
        cnpj: "12.345.678/0001-90",
        contato: "João Silva",
        email: "joao@abc.com.br",
        telefone: "(11) 99999-9999",
        endereco: "Rua das Flores, 123 - São Paulo/SP",
        status: "ativo",
      },
      {
        id: 2,
        nome: "Fornecedor XYZ S.A.",
        cnpj: "98.765.432/0001-10",
        contato: "Maria Santos",
        email: "maria@xyz.com.br",
        telefone: "(11) 88888-8888",
        endereco: "Av. Principal, 456 - São Paulo/SP",
        status: "ativo",
      },
    ])

    // Mock data para pedidos
    setPedidos([
      {
        id: 1,
        numero: "PC-2024-001",
        fornecedor: "Distribuidora ABC Ltda",
        data: "2024-01-15",
        previsaoEntrega: "2024-01-22",
        valor: 2500.0,
        status: "pendente",
        itens: 15,
      },
      {
        id: 2,
        numero: "PC-2024-002",
        fornecedor: "Fornecedor XYZ S.A.",
        data: "2024-01-14",
        previsaoEntrega: "2024-01-20",
        valor: 1800.0,
        status: "aprovado",
        itens: 8,
      },
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800"
      case "inativo":
        return "bg-red-100 text-red-800"
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "aprovado":
        return "bg-blue-100 text-blue-800"
      case "entregue":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredFornecedores = fornecedores.filter(
    (fornecedor) =>
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) || fornecedor.cnpj.includes(searchTerm),
  )

  const filteredPedidos = pedidos.filter(
    (pedido) =>
      pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                    <p className="text-2xl font-bold">12</p>
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
                    <p className="text-2xl font-bold">5</p>
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
                    <p className="text-2xl font-bold">R$ 45.200</p>
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
                    <p className="text-2xl font-bold">{fornecedores.filter((f) => f.status === "ativo").length}</p>
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
                        <Badge className={getStatusColor(pedido.status)}>{pedido.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{pedido.fornecedor}</p>
                      <p className="text-sm text-gray-500">
                        Previsão: {new Date(pedido.previsaoEntrega).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {pedido.valor.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{pedido.itens} itens</p>
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
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            <Button>
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
                    {filteredPedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{pedido.numero}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{pedido.fornecedor}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(pedido.data).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(pedido.previsaoEntrega).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">R$ {pedido.valor.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(pedido.status)}>{pedido.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFornecedores.map((fornecedor) => (
              <Card key={fornecedor.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{fornecedor.nome}</CardTitle>
                      <p className="text-sm text-gray-600">{fornecedor.cnpj}</p>
                    </div>
                    <Badge className={getStatusColor(fornecedor.status)}>{fornecedor.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{fornecedor.contato}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{fornecedor.endereco}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
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
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Hoje
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Esta Semana
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
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">PC-2024-001</p>
                      <p className="text-sm text-gray-600">Distribuidora ABC</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Previsto</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">PC-2024-003</p>
                      <p className="text-sm text-gray-600">Fornecedor XYZ</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Entregue</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entregas Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">PC-2024-002</p>
                      <p className="text-sm text-gray-600">Fornecedor ABC</p>
                      <p className="text-xs text-red-600">Atraso: 2 dias</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Atrasado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">PC-2024-004</p>
                      <p className="text-sm text-gray-600">Distribuidora XYZ</p>
                      <p className="text-xs text-yellow-600">Amanhã</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
