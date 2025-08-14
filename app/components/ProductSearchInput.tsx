"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Barcode, Check } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  unit: string;
  active: boolean;
}

interface ProductSearchInputProps {
  onProductSelect: (product: Product) => void;
  selectedProductId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ProductSearchInput({
  onProductSelect,
  selectedProductId,
  placeholder = "Digite código, código de barras ou nome do produto...",
  disabled = false,
}: ProductSearchInputProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce para busca
  useEffect(() => {
    if (!query || query.length < 2) {
      setProducts([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await searchProducts(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchProducts = async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const result = await response.json();

      console.log(
        "Resultado da busca dos produtos --------------------:",
        result.success
      );

      if (result.success) {
        console.log("Produtos encontrados: dentro do if", result.data);
        setProducts(result.data);
        setShowDropdown(result.data.length > 0);
      } else {
        setProducts([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProducts([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuery(product.name);
    setShowDropdown(false);
    onProductSelect(product);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getSearchIcon = (product: Product) => {
    if (product.code === query) {
      return <Package className="h-4 w-4 text-blue-600" />;
    }
    if (product.barcode === query) {
      return <Barcode className="h-4 w-4 text-green-600" />;
    }
    return <Search className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (products.length > 0) {
              console.log("Focando no input, mostrando dropdown");
              setShowDropdown(true);
            }
          }}
          disabled={disabled}
          className={`pl-10 pr-4 ${
            selectedProduct ? "border-green-500 bg-green-50" : ""
          }`}
        />
        {selectedProduct && (
          <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && products.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {products.map(
            (product) => (
              console.log("Renderizando produto: no map", product),
              (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    selectedProductId === product.id
                      ? "bg-green-50 border-green-200"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSearchIcon(product)}
                        <span className="font-medium text-sm">
                          {product.name}
                        </span>
                        {selectedProductId === product.id && (
                          <Check className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {product.code}
                        </Badge>
                        {product.barcode && (
                          <Badge variant="secondary" className="text-xs">
                            <Barcode className="h-3 w-3 mr-1" />
                            {product.barcode}
                          </Badge>
                        )}
                        <span>•</span>
                        <span>
                          Estoque: {product.stock} {product.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatCurrency(product.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        /{product.unit}
                      </div>
                    </div>
                  </div>
                </button>
              )
            )
          )}
        </div>
      )}

      {/* Dicas quando campo vazio */}
      {!query && !selectedProduct && (
        <div className="absolute z-40 w-full mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4" />
            <span className="font-medium">Dicas de busca:</span>
          </div>
          <ul className="text-xs space-y-1 ml-6">
            <li>• Digite o código do produto (ex: 000001)</li>
            <li>• Escaneie ou digite o código de barras</li>
            <li>• Digite parte do nome do produto</li>
          </ul>
        </div>
      )}
    </div>
  );
}
