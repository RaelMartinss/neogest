"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Plus, Minus, Eye, DollarSign, Loader2, AlertCircle } from "lucide-react"
import type { Sale, CashRegister } from "../types/sale"
import { useAuth } from "@/contexts/auth-context"


export default function CaixaControl() {
  const { isAuthenticated, token } = useAuth()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCashRegister()
      fetchTodaySales()
    }
  }, [isAuthenticated])

  const fetchCashRegister = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Buscando status do caixa...")

      const response = await fetch("/api/cash-register", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      console.log("Status da resposta:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Dados do caixa---------------------:", data)
        setCashRegister(data.cashRegister)
      } else {
        let errorMsg = "Erro ao buscar status do caixa"
        try {
          const errJson = await response.json()
          errorMsg = errJson.error ?? errorMsg
        } catch {
          // resposta não-JSON (possível HTML de 500)
          errorMsg = await response.text()
        }
        console.error("Erro ao buscar caixa:", errorMsg)
        setError(errorMsg)
      }
    } catch (error) {
      console.error("Erro ao buscar caixa:", error)
      setError("Erro de conexão ao buscar caixa")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTodaySales = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/sales?startDate=${today}T00:00:00Z&endDate=${today}T23:59:59Z`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Vendas do dia-----------------------------:", data.sales)
        setSales(data.sales?.filter((sale: Sale) => sale.status === "completed") ?? [])
      }
    } catch (error) {
      console.error("Erro ao buscar vendas:", error)
    }
  }

  const openCashRegister = async () => {
    const amount = prompt("Valor inicial do caixa:")
    if (amount === null) return

    try {
      console.log("Tentando abrir caixa com valor:", amount)
      setError(null)

      const response = await fetch("/api/cash-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          action: "open",
          amount: Number.parseFloat(amount) || 0,
        }),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Caixa aberto com sucesso: --------------", data)
        setCashRegister(data.cashRegister)
        alert("Caixa aberto com sucesso!")
      } else {
        let errorMsg = "Erro ao abrir caixa"
        try {
          const errJson = await response.json()
          errorMsg = errJson.error ?? errorMsg
        } catch {
          errorMsg = await response.text()
        }
        console.error("Erro do servidor:", errorMsg)
        setError(errorMsg)
        alert(errorMsg)
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
      setError("Erro de conexão ao abrir caixa")
      alert("Erro de conexão ao abrir caixa")
    }
  }

  const closeCashRegister = async () => {
    if (!confirm("Tem certeza que deseja fechar o caixa?")) return

    try {
      console.log("Tentando fechar caixa...")
      setError(null)

      const response = await fetch("/api/cash-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          action: "close",
        }),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Caixa fechado com sucesso:", data)
        setCashRegister(data.cashRegister)
        alert("Caixa fechado com sucesso!")
      } else {
        let errorMsg = "Erro ao fechar caixa"
        try {
          const errJson = await response.json()
          errorMsg = errJson.error ?? errorMsg
        } catch {
          errorMsg = await response.text()
        }
        console.error("Erro do servidor:", errorMsg)
        setError(errorMsg)
        alert(errorMsg)
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
      setError("Erro de conexão ao fechar caixa")
      alert("Erro de conexão ao fechar caixa")
    }
  }

  // Calcular totais das vendas do dia
  const todayStats = {
    totalSales: sales.length,
    totalAmount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    cashAmount: sales
      .filter((s) => s.tipoPagamento === "cash")
      .reduce((sum, sale) => sum + sale.totalAmount, 0),
    cardAmount: sales
      .filter((s) => s.tipoPagamento === "credit_card" || s.tipoPagamento === "debit_card")
      .reduce((sum, sale) => sum + sale.totalAmount, 0),
    pixAmount: sales
      .filter((s) => s.tipoPagamento === "pix")
      .reduce((sum, sale) => sum + sale.totalAmount, 0),
  };
  

  console.log("SAles 0000 000000  Vendas do dia======================================:", sales)
  console.log("Estatísticas do dia===================================:", todayStats)
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: "Dinheiro",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      pix: "PIX",
      check: "Cheque",
    }
    return labels[method as keyof typeof labels] || method
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Controle de Caixa</h1>
          <p className="text-gray-600">Gestão financeira em tempo real</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchCashRegister} className="w-full">
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Caixa</h1>
        <p className="text-gray-600">Gestão financeira em tempo real</p>
      </div>

      {/* Status do Caixa */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status do Caixa</span>
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  cashRegister?.is_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {cashRegister?.is_open ? "Aberto" : "Fechado"}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashRegister ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="text-2xl font-bold"> R$ {Number(cashRegister.opening_amount).toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Vendas do Dia</p>
                  <p className="text-2xl font-bold text-green-600">R$ {todayStats.totalAmount?.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold">{todayStats.totalSales}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Saldo Atual</p>                                                                                                   
                  <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    Number(cashRegister.opening_amount) + Number(todayStats.totalAmount)
                  )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhum caixa aberto</p>
                <Button onClick={openCashRegister}>Abrir Caixa</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendas do Dia */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendas do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sales?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhuma venda hoje</p>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Venda #00{sale.saleNumber}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(sale.createdAt)} - {getPaymentMethodLabel(sale.tipoPagamento)}
                          </p>
                          {sale.customerName && <p className="text-sm text-gray-600">Cliente: {sale.customerName}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">R$ {sale.totalAmount?.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{sale?.items?.length} itens</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações e Resumo */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Suprimento
              </Button>
              <Button className="w-full" variant="outline">
                <Minus className="w-4 h-4 mr-2" />
                Sangria
              </Button>
              <Button className="w-full" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Conferir Caixa
              </Button>
              {cashRegister?.is_open ? (
                <Button className="w-full" variant="destructive" onClick={closeCashRegister}>
                  Fechar Caixa
                </Button>
              ) : (
                <Button className="w-full" onClick={openCashRegister}>
                  Abrir Caixa
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Resumo por Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Vendas:</span>
                  <span className="font-bold">{todayStats.totalSales}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket Médio:</span>
                  <span className="font-bold">
                    R${" "}
                    {todayStats.totalSales > 0 ? (todayStats.totalAmount / todayStats.totalSales)?.toFixed(2) : "0,00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dinheiro:</span>
                  <span className="font-bold">R$ {todayStats.cashAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cartão:</span>
                  <span className="font-bold">R$ {todayStats.cardAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PIX:</span>
                  <span className="font-bold">R$ {todayStats.pixAmount?.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-green-600">R$ {todayStats.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
