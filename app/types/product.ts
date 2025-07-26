export interface Product {
  id: string
  codigo: string
  name: string
  barcode?: string
  description?: string
  categoryId?: string | null
  categoryName?: string
  category?: string
  supplierId?: string | null
  supplierName?: string
  supplier?: string
  stockQuantity: number
  minStock: number
  maxStock: number
  costPrice: number
  salePrice: number
  unit: string // Unidade de medida (UN, KG, L, M, etc.)
  unitName?: string // Nome completo da unidade
  isActive: boolean
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  description?: string
}

export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface Unit {
  code: string // Código da unidade (UN, KG, L, etc.)
  name: string // Nome da unidade (Unidade, Quilograma, Litro, etc.)
  description?: string
}

export interface StockMovement {
  id: string
  productId: string
  type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reason: string
  userId?: string
  createdAt: string
}

export interface StockStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  activeProducts: number
}

export interface ProductFilters {
  search: string
  category: string
  supplier: string
  status: string
}

// Unidades de medida mais comuns
export const COMMON_UNITS = [
  { code: "UN", name: "Unidade", description: "Peça, item individual" },
  { code: "KG", name: "Quilograma", description: "Peso em quilogramas" },
  { code: "G", name: "Grama", description: "Peso em gramas" },
  { code: "L", name: "Litro", description: "Volume em litros" },
  { code: "ML", name: "Mililitro", description: "Volume em mililitros" },
  { code: "M", name: "Metro", description: "Comprimento em metros" },
  { code: "CM", name: "Centímetro", description: "Comprimento em centímetros" },
  { code: "M2", name: "Metro Quadrado", description: "Área em metros quadrados" },
  { code: "M3", name: "Metro Cúbico", description: "Volume em metros cúbicos" },
  { code: "CX", name: "Caixa", description: "Embalagem tipo caixa" },
  { code: "PCT", name: "Pacote", description: "Embalagem tipo pacote" },
  { code: "DZ", name: "Dúzia", description: "Conjunto de 12 unidades" },
  { code: "PR", name: "Par", description: "Conjunto de 2 unidades" },
]
