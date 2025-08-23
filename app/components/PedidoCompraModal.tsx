"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { Fornecedor } from "@/lib/purchases-service"

interface ItemPedido {
  codigo_produto?: string
  nome_produto: string
  quantidade: number
  preco_unitario: number
  desconto: number
  valor_total: number
}

interface PedidoCompraModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  fornecedores: Fornecedor[]
  isLoading?: boolean
}

export default function PedidoCompraModal({
  isOpen,
  onClose,
  onSave,
  fornecedores,
  isLoading,
}: PedidoCompraModalProps) {
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    data_previsao_entrega: "",
    observacoes: "",
  })

  const [itens, setItens] = useState<ItemPedido[]>([
    {
      codigo_produto: "",
      nome_produto: "",
      quantidade: 1,
      preco_unitario: 0,
      desconto: 0,
      valor_total: 0,
    },
  ])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fornecedor_id: "",
        data_previsao_entrega: "",
        observacoes: "",
      })
      setItens([
        {
          codigo_produto: "",
          nome_produto: "",
          quantidade: 1,
          preco_unitario: 0,
          desconto: 0,
          valor_total: 0,
        },
      ])
    }
  }, [isOpen])

  const calcularValorItem = (quantidade: number, preco: number, desconto: number) => {
    return quantidade * preco - desconto
  }

  const handleItemChange = (index: number, field: keyof ItemPedido, value: string | number) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [field]: value }

    // Recalcular valor total do item
    if (field === "quantidade" || field === "preco_unitario" || field === "desconto") {
      novosItens[index].valor_total = calcularValorItem(
        novosItens[index].quantidade,
        novosItens[index].preco_unitario,
        novosItens[index].desconto,
      )
    }

    setItens(novosItens)
  }

  const adicionarItem = () => {
    setItens([
      ...itens,
      {
        codigo_produto: "",
        nome_produto: "",
        quantidade: 1,
        preco_unitario: 0,
        desconto: 0,
        valor_total: 0,
      },
    ])
  }

  const removerItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index))
    }
  }

  const valorTotal = itens.reduce((total, item) => total + item.valor_total, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fornecedor_id) {
      alert("Selecione um fornecedor")
      return
    }

    if (itens.some((item) => !item.nome_produto || item.quantidade <= 0 || item.preco_unitario <= 0)) {
      alert("Preencha todos os itens corretamente")
      return
    }

    onSave({
      ...formData,
      fornecedor_id: Number.parseInt(formData.fornecedor_id),
      itens: itens.map((item) => ({
        ...item,
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario),
        desconto: Number(item.desconto),
      })),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido de Compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, fornecedor_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores
                    .filter((f) => f.status === "ativo")
                    .map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_previsao">Data Previsão Entrega</Label>
              <Input
                id="data_previsao"
                type="date"
                value={formData.data_previsao_entrega}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_previsao_entrega: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Itens do Pedido</h3>
              <Button type="button" onClick={adicionarItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {itens.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removerItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input
                        value={item.codigo_produto}
                        onChange={(e) => handleItemChange(index, "codigo_produto", e.target.value)}
                        placeholder="Código do produto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nome do Produto *</Label>
                      <Input
                        value={item.nome_produto}
                        onChange={(e) => handleItemChange(index, "nome_produto", e.target.value)}
                        placeholder="Nome do produto"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, "quantidade", Number.parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preço Unitário *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.preco_unitario}
                        onChange={(e) =>
                          handleItemChange(index, "preco_unitario", Number.parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Desconto</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => handleItemChange(index, "desconto", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-medium">Valor Total: R$ {item.valor_total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right text-lg font-bold">Total do Pedido: R$ {valorTotal.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
