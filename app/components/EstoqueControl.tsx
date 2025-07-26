"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  Activity,
} from "lucide-react"
import type { Product, Category, Supplier, ProductFilters, StockStats } from "../types/product"

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

import ProductModal from "./ProductModal"
import StockMovementModal from "./StockMovementModal"
import StockStatsPanel from "./StockStatsPanel"

export default function EstoqueControl() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    activeProducts: 0,
  })
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: "all",
    supplier: "all",
    status: "all",
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState("products")

  useEffect(() => {
    loadProducts()
  }, [filters, pagination.page])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append("search", filters.search)
      if (filters.category !== "all") params.append("categoryId", filters.category)
      if (filters.supplier !== "all") params.append("supplierId", filters.supplier)
      if (filters.status !== "all") params.append("status", filters.status)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      console.log("Carregando produtos com filtros:", Object.fromEntries(params))

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      console.log("Resposta da API:", data)

      if (data.success) {
        setProducts(data.products || [])
        setStats(data.stats || stats)
        setCategories(data.categories || [])
        setSuppliers(data.suppliers || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        console.error("Erro na API:", data.error)
        alert(`Erro ao carregar produtos: ${data.error}`)
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      alert("Erro de conexão ao carregar produtos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewProduct = () => {
    setSelectedProduct(null)
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        alert("Produto excluído com sucesso!")
        await loadProducts()
      } else {
        alert(`Erro ao excluir produto: ${data.error}`)
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      alert("Erro de conexão ao excluir produto")
    }
  }

  const handleStockMovement = (product: Product) => {
    setSelectedProduct(product)
    setShowStockModal(true)
  }

  const handleProductSaved = async () => {
    setShowProductModal(false)
    setSelectedProduct(null)
    await loadProducts()
  }

  const handleStockUpdated = async () => {
    setShowStockModal(false)
    setSelectedProduct(null)
    await loadProducts()
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset para primeira página
  }

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>
    }
    if (product.stockQuantity <= product.minStock) {
      return <Badge variant="secondary">Estoque Baixo</Badge>
    }
    return <Badge variant="default">Normal</Badge>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-gray-600">Gerencie seus produtos e estoque</p>
        </div>
        <Button onClick={loadProducts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalProducts)}</div>
                <p className="text-xs text-muted-foreground">{formatNumber(stats.activeProducts)} ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{formatNumber(stats.lowStockProducts)}</div>
                <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatNumber(stats.outOfStockProducts)}</div>
                <p className="text-xs text-muted-foreground">Produtos em falta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
                <p className="text-xs text-muted-foreground">Valor do estoque</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão Novo Produto - Destacado */}
          <div className="flex justify-center">
            <Button
              onClick={handleNewProduct}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Novo Produto
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Nome, código ou código de barras..."
                      value={filters.search}
                      onChange={(e) => handleFiltersChange({ search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFiltersChange({ category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* <div>
                  <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                  <select
                    value={filters.supplier}
                    onChange={(e) => handleFiltersChange({ supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">Todos os fornecedores</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div> */}

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFiltersChange({ status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="low_stock">Estoque Baixo</option>
                    <option value="out_of_stock">Sem Estoque</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Produtos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Produtos ({formatNumber(pagination.total)})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando produtos...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum produto encontrado</p>
                  <Button onClick={handleNewProduct} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Produto
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Código</th>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Categoria</th>
                        <th className="text-left p-2">Estoque</th>
                        <th className="text-left p-2">Preço</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-mono text-sm">{product.codigo || product.id}</div>
                              {product.barcode && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  {product.barcode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500">{product.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">{product.category}</td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {formatNumber(product.stockQuantity)} {product.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                Min: {formatNumber(product.minStock)} | Max: {formatNumber(product.maxStock)}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{formatCurrency(product.salePrice)}</div>
                              <div className="text-xs text-gray-500">Custo: {formatCurrency(product.costPrice)}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {getStockStatus(product)}
                              {!product.isActive && <Badge variant="outline">Inativo</Badge>}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                title="Editar produto"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStockMovement(product)}
                                title="Movimentar estoque"
                              >
                                <Package className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                title="Excluir produto"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação */}
              {!isLoading && products.length > 0 && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} produtos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <StockStatsPanel />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setShowProductModal(false)}
          onSave={handleProductSaved}
        />
      )}

      {showStockModal && selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          onClose={() => setShowStockModal(false)}
          onSave={handleStockUpdated}
        />
      )}
    </div>
  )
}
