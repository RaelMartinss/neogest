"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Plus, Package, ArrowUpDown, RefreshCw, Trash2 } from "lucide-react"
import ProductSearchInput from "./ProductSearchInput"

interface Product {
  id: string
  codigo: string
  nome: string
  codigoBarras?: string
  precoVenda: number
  estoqueAtual: number
  unidade: string
  ativo: boolean
}

interface ExchangeReturnReason {
  id: string
  code: string
  name: string
  type: "TROCA" | "DEVOLUCAO" | "AMBOS"
  requiresApproval: boolean
  active: boolean
}

interface ExchangeReturnItem {
  id: string
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  subtotal: number
  newProductId?: string
  newProductName?: string
  newProductCode?: string
  newQuantity: number
  newUnitPrice: number
  newSubtotal: number
}

interface CreateExchangeReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateExchangeReturnModal({ open, onOpenChange, onSuccess }: CreateExchangeReturnModalProps) {
  const [type, setType] = useState<"TROCA" | "DEVOLUCAO">("TROCA")
  const [reasons, setReasons] = useState<ExchangeReturnReason[]>([])
  const [selectedReasonId, setSelectedReasonId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerDocument, setCustomerDocument] = useState("")
  const [originalSaleNumber, setOriginalSaleNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ExchangeReturnItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      loadReasons()
      resetForm()
    }
  }, [open])

  useEffect(() => {
    loadReasons()
  }, [type])

  const loadReasons = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exchanges-returns/reasons?type=${type}`)
      const result = await response.json()

      if (result.success) {
        setReasons(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar motivos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar motivos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setType("TROCA")
    setSelectedReasonId("")
    setCustomerName("")
    setCustomerDocument("")
    setOriginalSaleNumber("")
    setNotes("")
    setItems([])
  }

  const addItem = () => {
    const newItem: ExchangeReturnItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      productCode: "",
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      newProductId: "",
      newProductName: "",
      newProductCode: "",
      newQuantity: 0,
      newUnitPrice: 0,
      newSubtotal: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const updateItem = (itemId: string, field: string, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }

          // Recalcular subtotal do produto original
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice
          }

          // Recalcular subtotal do novo produto (para trocas)
          if (field === "newQuantity" || field === "newUnitPrice") {
            updatedItem.newSubtotal = updatedItem.newQuantity * updatedItem.newUnitPrice
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const handleProductSelect = (itemId: string, product: Product) => {
    updateItem(itemId, "productId", product.id)
    updateItem(itemId, "productName", product.nome)
    updateItem(itemId, "productCode", product.codigo)
    updateItem(itemId, "unitPrice", product.precoVenda)
    updateItem(itemId, "subtotal", 1 * product.precoVenda)
  }

  const handleNewProductSelect = (itemId: string, product: Product) => {
    updateItem(itemId, "newProductId", product.id)
    updateItem(itemId, "newProductName", product.nome)
    updateItem(itemId, "newProductCode", product.codigo)
    updateItem(itemId, "newUnitPrice", product.precoVenda)
    updateItem(itemId, "newQuantity", 1)
    updateItem(itemId, "newSubtotal", 1 * product.precoVenda)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calculateNewTotal = () => {
    return items.reduce((sum, item) => sum + item.newSubtotal, 0)
  }

  const calculateDifference = () => {
    return calculateNewTotal() - calculateTotal()
  }

  const validateForm = () => {
    if (!selectedReasonId) {
      toast({
        title: "Erro",
        description: "Selecione um motivo",
        variant: "destructive",
      })
      return false
    }

    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item",
        variant: "destructive",
      })
      return false
    }

    for (const item of items) {
      if (!item.productId || item.quantity <= 0) {
        toast({
          title: "Erro",
          description: "Todos os itens devem ter produto e quantidade válidos",
          variant: "destructive",
        })
        return false
      }

      if (type === "TROCA" && (!item.newProductId || item.newQuantity <= 0)) {
        toast({
          title: "Erro",
          description: "Para trocas, todos os itens devem ter novo produto e quantidade",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)

      const data = {
        type,
        reasonId: selectedReasonId,
        customerName: customerName || null,
        customerDocument: customerDocument || null,
        originalSaleNumber: originalSaleNumber || null,
        notes: notes || null,
        userId: 1, // TODO: Pegar do contexto de autenticação
        userName: "Usuário", // TODO: Pegar do contexto de autenticação
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          newProductId: item.newProductId || null,
          newProductName: item.newProductName || null,
          newProductCode: item.newProductCode || null,
          newQuantity: item.newQuantity || 0,
          newUnitPrice: item.newUnitPrice || 0,
        })),
      }

      console.log("Enviando dados:", data)

      const response = await fetch("/api/exchanges-returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        throw new Error(result.error || "Erro ao criar solicitação")
      }
    } catch (error) {
      console.error("Erro ao criar solicitação:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "TROCA" ? (
              <>
                <ArrowUpDown className="h-5 w-5" />
                Nova Troca
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Nova Devolução
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Crie uma nova solicitação de {type === "TROCA" ? "troca" : "devolução"} de produtos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo e Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Solicitação</Label>
              <Select value={type} onValueChange={(value: "TROCA" | "DEVOLUCAO") => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TROCA">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Troca
                    </div>
                  </SelectItem>
                  <SelectItem value="DEVOLUCAO">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Devolução
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Motivo *</Label>
              <Select value={selectedReasonId} onValueChange={setSelectedReasonId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{reason.name}</span>
                        {reason.requiresApproval && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Requer aprovação
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="customerDocument">CPF/CNPJ</Label>
                <Input
                  id="customerDocument"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="originalSaleNumber">Número da Venda</Label>
                <Input
                  id="originalSaleNumber"
                  value={originalSaleNumber}
                  onChange={(e) => setOriginalSaleNumber(e.target.value)}
                  placeholder="Ex: VND-000001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Itens *</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <Card key={item.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Item {index + 1}</CardTitle>
                          <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Produto Original */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Produto a ser {type === "TROCA" ? "trocado" : "devolvido"}
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <ProductSearchInput
                                onProductSelect={(product) => handleProductSelect(item.id, product)}
                                selectedProductId={item.productId}
                                placeholder="Busque por código, código de barras ou nome..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`quantity-${item.id}`}>Quantidade</Label>
                                <Input
                                  id={`quantity-${item.id}`}
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`unitPrice-${item.id}`}>Preço Unit.</Label>
                                <Input
                                  id={`unitPrice-${item.id}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>
                          {item.productName && (
                            <div className="mt-2 p-2 bg-gray-50 rounded flex justify-between items-center">
                              <div>
                                <span className="font-medium">{item.productName}</span>
                                <Badge variant="outline" className="ml-2">
                                  {item.productCode}
                                </Badge>
                              </div>
                              <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                            </div>
                          )}
                        </div>

                        {/* Novo Produto (apenas para trocas) */}
                        {type === "TROCA" && (
                          <div className="pt-4 border-t">
                            <Label className="text-sm font-medium mb-2 block text-green-600">
                              Novo produto (troca)
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <ProductSearchInput
                                  onProductSelect={(product) => handleNewProductSelect(item.id, product)}
                                  selectedProductId={item.newProductId}
                                  placeholder="Busque o novo produto..."
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor={`newQuantity-${item.id}`}>Nova Qtd</Label>
                                  <Input
                                    id={`newQuantity-${item.id}`}
                                    type="number"
                                    min="1"
                                    value={item.newQuantity}
                                    onChange={(e) => updateItem(item.id, "newQuantity", Number(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`newUnitPrice-${item.id}`}>Novo Preço</Label>
                                  <Input
                                    id={`newUnitPrice-${item.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.newUnitPrice}
                                    onChange={(e) => updateItem(item.id, "newUnitPrice", Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            </div>
                            {item.newProductName && (
                              <div className="mt-2 p-2 bg-green-50 rounded flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{item.newProductName}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {item.newProductCode}
                                  </Badge>
                                </div>
                                <span className="font-bold text-green-600">{formatCurrency(item.newSubtotal)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais sobre a solicitação..."
              rows={3}
            />
          </div>

          {/* Resumo */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(calculateTotal())}</div>
                    <div className="text-sm text-muted-foreground">Valor Original</div>
                  </div>
                  {type === "TROCA" && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(calculateNewTotal())}</div>
                        <div className="text-sm text-muted-foreground">Novo Valor</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            calculateDifference() > 0
                              ? "text-green-600"
                              : calculateDifference() < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {calculateDifference() > 0 ? "+" : ""}
                          {formatCurrency(calculateDifference())}
                        </div>
                        <div className="text-sm text-muted-foreground">Diferença</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || items.length === 0}>
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar {type === "TROCA" ? "Troca" : "Devolução"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
