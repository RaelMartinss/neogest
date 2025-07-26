"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  X,
  Save,
} from "lucide-react"
import type { Customer, CustomerWithStats } from "@/lib/customer-service"

interface CustomerModalProps {
  customer?: Customer
  isOpen: boolean
  onClose: () => void
  onSave: (customer: Partial<Customer>) => void
}

function CustomerModal({ customer, isOpen, onClose, onSave }: CustomerModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    notes: "",
  })

  useEffect(() => {
    if (customer) {
      setFormData(customer)
    } else {
      setFormData({
        name: "",
        email: "",
        cpf: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipcode: "",
        notes: "",
      })
    }
  }, [customer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{customer ? "Editar Cliente" : "Novo Cliente"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <Input value={formData.cpf || ""} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <Input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Input
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CEP</label>
              <Input
                value={formData.zipcode || ""}
                onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CustomerDetailsModalProps {
  customer: CustomerWithStats | null
  purchases: any[]
  isOpen: boolean
  onClose: () => void
}

function CustomerDetailsModal({ customer, purchases, isOpen, onClose }: CustomerDetailsModalProps) {
  if (!isOpen || !customer) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalhes do Cliente</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Cliente */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-500 text-white">{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-sm text-gray-600">Cliente desde {formatDate(customer.created_at)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && ` - ${customer.state}`}
                    </span>
                  </div>
                )}

                {customer.notes && (
                  <div className="pt-2">
                    <p className="text-sm font-medium">Observações:</p>
                    <p className="text-sm text-gray-600">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Total de Compras</span>
                  </div>
                  <Badge variant="secondary">{customer.stats.totalPurchases}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Total Gasto</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(customer.stats.totalSpent)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Ticket Médio</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(customer.stats.averageTicket)}</span>
                </div>
                {customer.stats.lastPurchase && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Última Compra</span>
                    <span className="text-sm">{formatDate(customer.stats.lastPurchase)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Compras */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma compra encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Venda #{purchase.number}</p>
                            <p className="text-sm text-gray-600">{formatDate(purchase.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(purchase.total)}</p>
                            <Badge variant="outline">{purchase.paymentMethod}</Badge>
                          </div>
                        </div>
                        {purchase.items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Itens:</p>
                            <div className="space-y-1">
                              {purchase.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantity}x {item.product_name}
                                  </span>
                                  <span>{formatCurrency(item.total)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientesControl() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null)
  const [customerPurchases, setCustomerPurchases] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async (query?: string) => {
    try {
      setIsLoading(true)
      const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers"
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.length >= 2 || value.length === 0) {
      fetchCustomers(value)
    }
  }

  const handleViewCustomer = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedCustomer(data.customer)
        setCustomerPurchases(data.purchases)
        setIsDetailsModalOpen(true)
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do cliente:", error)
    }
  }

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      console.log("💾 Salvando cliente:", customerData)
      
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers"
      const method = editingCustomer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("✅ Cliente salvo com sucesso:", data)
        setIsModalOpen(false)
        setEditingCustomer(undefined)
        fetchCustomers()
        // Aqui você pode adicionar uma notificação de sucesso
      } else {
        console.error("❌ Erro ao salvar cliente:", data.error)
        // Aqui você pode adicionar uma notificação de erro
        alert(`Erro ao salvar cliente: ${data.error}`)
      }
    } catch (error) {
      console.error("❌ Erro ao salvar cliente:", error)
      alert("Erro ao salvar cliente. Verifique a conexão e tente novamente.")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Clientes</h1>
        <p className="text-gray-600">Controle completo de clientes e histórico</p>
      </div>

      {/* Barra de Busca e Ações */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-500 text-white">{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-gray-500" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span>
                          {customer.city}
                          {customer.state && ` - ${customer.state}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Desde {formatDate(customer.created_at)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <CustomerModal
        customer={editingCustomer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCustomer(undefined)
        }}
        onSave={handleSaveCustomer}
      />

      <CustomerDetailsModal
        customer={selectedCustomer}
        purchases={customerPurchases}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedCustomer(null)
          setCustomerPurchases([])
        }}
      />
    </div>
  )
}
