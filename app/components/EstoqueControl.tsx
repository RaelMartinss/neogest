"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { Product, StockStats, Category, Supplier } from "../types/product";
import { useAuth } from "@/contexts/auth-context";
import ProductModal from "./ProductModal";
import StockMovementModal from "./StockMovementModal";

export default function EstoqueControl() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    activeProducts: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalFiltered, setTotalFiltered] = useState(0);

  useEffect(() => {
    setCurrentPage(1); // Reset para primeira página quando mudar filtros
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedSupplier, selectedStatus]);

  // Remover o useEffect separado para currentPage para evitar loops

  const fetchProducts = async (page = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Buscando produtos...");

      const params = new URLSearchParams({
        search: searchTerm,
        category: selectedCategory,
        supplier: selectedSupplier,
        status: selectedStatus,
        page: String(page),
        limit: String(itemsPerPage),
      });

      const response = await fetch(`/api/products?${params}`, {
        credentials: "include",
      });

      console.log("Status da resposta:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Dados recebidos:", data);

        // Verificar e normalizar dados dos produtos
        const normalizedProducts = (data.products || []).map(
          (product: any) => ({
            ...product,
            costPrice: Number(product.cost_price) || 0,
            salePrice: Number(product.sale_price) || 0,
            stockQuantity: Number(product.stockQuantity) || 0,
            minStock: Number(product.min_stock) || 0,
            maxStock: Number(product.max_stock) || 0,
            // Manter compatibilidade com nomes antigos
            costPrice: Number(product.costPrice) || 0,
            salePrice: Number(product.sale_price) || 0,
            stockQuantity: Number(product.stockQuantity) || 0,
            minStock: Number(product.minStock) || 0,
            maxStock: Number(product.maxStock) || 0,
            isActive: product.is_active !== false,
            codigo: product.codigo || "",
          })
        );

        console.log(
          "Produtos normalizados======================================================:",
          normalizedProducts
        );

        setProducts(normalizedProducts);
        setTotalFiltered(
          data.stats?.totalProducts || normalizedProducts.length
        );

        // Verificar e normalizar stats
        const normalizedStats = {
          totalProducts: Number(data.stats?.totalProducts) || 0,
          lowStockProducts: Number(data.stats?.lowStockProducts) || 0,
          outOfStockProducts: Number(data.stats?.outOfStockProducts) || 0,
          totalValue: Number(data.stats?.totalValue) || 0,
          activeProducts: Number(data.stats?.activeProducts) || 0,
        };

        setStats(normalizedStats);
        setCategories(data.categories || []);
        setSuppliers(data.suppliers || []);
      } else {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        setError(`Erro ao buscar produtos: ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setError("Erro de conexão ao buscar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao excluir produto");
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleStockMovement = (product: Product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const getStatusBadge = (product: Product) => {
    const isActive = product.isActive ?? product.isActive ?? true;
    const stockQuantity = product.stockQuantity ?? product.stockQuantity ?? 0;
    const minStock = product.minStock ?? product.minStock ?? 0;

    if (!isActive) {
      return <Badge variant="destructive">Inativo</Badge>;
    }
    if (stockQuantity === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (stockQuantity <= minStock) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Estoque Baixo</Badge>
      );
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const canEdit = hasPermission("estoque", "edit");
  const canDelete = hasPermission("estoque", "delete");
  const canCreate = hasPermission("estoque", "create");

  // Lógica de paginação
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products; // já vem paginado do backend

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchProducts(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchProducts(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Controle de Estoque
          </h1>
          <p className="text-gray-600">Gestão completa do inventário</p>
        </div>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchProducts}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Controle de Estoque
        </h1>
        <p className="text-gray-600">Gestão completa do inventário</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">{stats.totalProducts || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.lowStockProducts || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.outOfStockProducts || 0}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.activeProducts || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(stats.totalValue || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produtos em Estoque</span>
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="low_stock">Estoque Baixo</option>
              <option value="out_of_stock">Sem Estoque</option>
            </select>
            {canCreate && (
              <Button onClick={() => setShowProductModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-left p-3">Estoque</th>
                  <th className="text-left p-3">Preço Custo</th>
                  <th className="text-left p-3">Preço Venda</th>
                  <th className="text-left p-3">Fornecedor</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => {
                    // Garantir que os valores existem e são números
                    const stockQuantity = product.stockQuantity ?? 0;
                    const minStock = product.minStock ?? 0;
                    const maxStock = product.maxStock ?? 0;
                    const costPrice = product.costPrice ?? 0;
                    const salePrice = product.salePrice ?? 0;
                    const categoryName =
                      product.categoryName ||
                      product.category_name ||
                      product.category ||
                      "N/A";
                    const supplierName =
                      product.supplierName ||
                      product.supplier_name ||
                      product.supplier ||
                      "N/A";

                    return (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {product.codigo || "N/A"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">
                              {product.name || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {product.barcode || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">{categoryName}</td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              stockQuantity <= minStock
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {stockQuantity}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {" "}
                            / {maxStock}
                          </span>
                        </td>
                        <td className="p-3">R$ {costPrice.toFixed(2)}</td>
                        <td className="p-3">R$ {salePrice.toFixed(2)}</td>
                        <td className="p-3">{supplierName}</td>
                        <td className="p-3">{getStatusBadge(product)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStockMovement(product)}
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação */}
          {totalFiltered > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(endIndex, totalFiltered)}{" "}
                de {totalFiltered} produtos
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            fetchProducts();
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showStockModal && selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          onClose={() => {
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            fetchProducts();
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
