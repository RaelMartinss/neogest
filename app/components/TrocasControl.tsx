"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Eye,
  Check,
  X,
  Clock,
  RefreshCw,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import CreateExchangeReturnModal from "./CreateExchangeReturnModal";

interface ExchangeReturnStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  exchanges: number;
  returns: number;
  totalAmount: number;
  monthly: {
    total: number;
    pending: number;
    exchanges: number;
    returns: number;
    amount: number;
  };
}

interface ExchangeReturnItem {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  newProductId?: string;
  newProductName?: string;
  newProductCode?: string;
  newQuantity: number;
  newUnitPrice: number;
  newSubtotal: number;
}

interface ExchangeReturn {
  id: string;
  number: string;
  type: "TROCA" | "DEVOLUCAO";
  originalSaleId?: string;
  originalSaleNumber?: string;
  customerId?: string;
  customerName?: string;
  customerDocument?: string;
  userId: string;
  userName: string;
  reasonId: string;
  reasonName: string;
  reasonDescription?: string;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "CONCLUIDO";
  totalAmount: number;
  notes?: string;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
  items: ExchangeReturnItem[];
}

export default function TrocasControl() {
  const [exchangesReturns, setExchangesReturns] = useState<ExchangeReturn[]>(
    []
  );
  const [stats, setStats] = useState<ExchangeReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ExchangeReturn | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [searchTerm, typeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Carregando dados...");

      // Carregar estatísticas
      const statsResponse = await fetch("/api/exchanges-returns/stats");
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
          console.log("Estatísticas carregadas:", statsResult.data);
        }
      }

      // Carregar lista
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      console.log("Parâmetros de busca:", params.toString());

      const listResponse = await fetch(
        `/api/exchanges-returns?${params.toString()}`
      );
      if (listResponse.ok) {
        const listResult = await listResponse.json();
        if (listResult.success) {
          setExchangesReturns(listResult.data || []);
          console.log(
            "Lista carregada:",
            listResult.data?.length || 0,
            "itens"
          );
        } else {
          console.error("Erro na resposta da API:", listResult.error);
          toast({
            title: "Erro",
            description: listResult.error || "Erro ao carregar dados",
            variant: "destructive",
          });
        }
      } else {
        console.error("Erro HTTP:", listResponse.status);
        toast({
          title: "Erro",
          description: "Erro de conexão com o servidor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/exchanges-returns/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          userId: 1, // TODO: Pegar do contexto de autenticação
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        loadData();
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem({ ...selectedItem, status: newStatus as any });
        }
      } else {
        throw new Error(result.error || "Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDENTE: {
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600",
      },
      APROVADO: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      REJEITADO: {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
      CONCLUIDO: {
        variant: "outline" as const,
        icon: Check,
        color: "text-blue-600",
      },
    };

    const config =
      variants[status as keyof typeof variants] || variants.PENDENTE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge
        variant={type === "TROCA" ? "default" : "secondary"}
        className="gap-1"
      >
        {type === "TROCA" ? (
          <ArrowUpDown className="h-3 w-3" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        {type}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredData = exchangesReturns.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalSaleNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const renderExchangeReturnCard = (item: ExchangeReturn) => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-bold">{item.number}</span>
              {getTypeBadge(item.type)}
              {getStatusBadge(item.status)}
              {item.requiresApproval && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requer aprovação
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {item.customerName && <p>Cliente: {item.customerName}</p>}
              {item.originalSaleNumber && (
                <p>Venda: {item.originalSaleNumber}</p>
              )}
              <p>Motivo: {item.reasonName}</p>
              <p>Criado: {formatDate(item.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-lg font-bold">
              {formatCurrency(item.totalAmount)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailsModal(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {item.status === "PENDENTE" && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusUpdate(item.id, "APROVADO")}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStatusUpdate(item.id, "REJEITADO")}
                    disabled={actionLoading === item.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {item.status === "APROVADO" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, "CONCLUIDO")}
                  disabled={actionLoading === item.id}
                >
                  {actionLoading === item.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Concluir
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthly.total} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.monthly.pending} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trocas</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.exchanges}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.monthly.exchanges} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.monthly.amount)} este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Trocas e Devoluções</CardTitle>
              <CardDescription>
                Gerencie solicitações de trocas e devoluções
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou venda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="TROCA">Trocas</SelectItem>
                <SelectItem value="DEVOLUCAO">Devoluções</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="APROVADO">Aprovado</SelectItem>
                <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todas ({filteredData.length})
              </TabsTrigger>
              <TabsTrigger value="exchanges">
                Trocas (
                {filteredData.filter((item) => item.type === "TROCA").length})
              </TabsTrigger>
              <TabsTrigger value="returns">
                Devoluções (
                {
                  filteredData.filter((item) => item.type === "DEVOLUCAO")
                    .length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes (
                {
                  filteredData.filter((item) => item.status === "PENDENTE")
                    .length
                }
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Carregando...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.map(renderExchangeReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="exchanges" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Carregando...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData
                    .filter((item) => item.type === "TROCA")
                    .map(renderExchangeReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="returns" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Carregando...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData
                    .filter((item) => item.type === "DEVOLUCAO")
                    .map(renderExchangeReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Carregando...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData
                    .filter((item) => item.status === "PENDENTE")
                    .map(renderExchangeReturnCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <CreateExchangeReturnModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadData}
      />

      {/* Modal de Detalhes */}
      {selectedItem && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedItem.number}
                {getTypeBadge(selectedItem.type)}
                {getStatusBadge(selectedItem.status)}
              </DialogTitle>
              <DialogDescription>
                Detalhes da solicitação de {selectedItem.type.toLowerCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tipo</Label>
                    <p>{selectedItem.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p>{selectedItem.status}</p>
                  </div>
                  {selectedItem.customerName && (
                    <div>
                      <Label className="text-sm font-medium">Cliente</Label>
                      <p>{selectedItem.customerName}</p>
                    </div>
                  )}
                  {selectedItem.originalSaleNumber && (
                    <div>
                      <Label className="text-sm font-medium">
                        Venda Original
                      </Label>
                      <p>{selectedItem.originalSaleNumber}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Motivo</Label>
                    <p>{selectedItem.reasonName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Usuário</Label>
                    <p>{selectedItem.userName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Data de Criação
                    </Label>
                    <p>{formatDate(selectedItem.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Valor Total</Label>
                    <p className="text-lg font-bold">
                      {formatCurrency(selectedItem.totalAmount)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Itens */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedItem.items.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">Item {index + 1}</h4>

                        {/* Produto original */}
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <Label className="text-sm font-medium">
                              Produto
                            </Label>
                            <p className="text-sm">{item.productName}</p>
                            {item.productCode && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {item.productCode}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Quantidade
                            </Label>
                            <p>{item.quantity}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Preço Unit.
                            </Label>
                            <p>{formatCurrency(item.unitPrice)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Subtotal
                            </Label>
                            <p className="font-medium">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>

                        {/* Produto de troca */}
                        {selectedItem.type === "TROCA" && item.newProductId && (
                          <div className="pt-3 border-t">
                            <h5 className="font-medium text-blue-600 mb-2">
                              Trocar Por
                            </h5>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <Label className="text-sm font-medium">
                                  Novo Produto
                                </Label>
                                <p className="text-sm">{item.newProductName}</p>
                                {item.newProductCode && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {item.newProductCode}
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Nova Quantidade
                                </Label>
                                <p>{item.newQuantity}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Novo Preço Unit.
                                </Label>
                                <p>{formatCurrency(item.newUnitPrice)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Novo Subtotal
                                </Label>
                                <p className="font-medium text-blue-600">
                                  {formatCurrency(item.newSubtotal)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              {selectedItem.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedItem.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              {selectedItem.status === "PENDENTE" && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleStatusUpdate(selectedItem.id, "REJEITADO");
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading === selectedItem.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedItem.id, "APROVADO");
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading === selectedItem.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              )}

              {selectedItem.status === "APROVADO" && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedItem.id, "CONCLUIDO");
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading === selectedItem.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
