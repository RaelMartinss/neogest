export interface Sale {
  id: string
  saleNumber: string
  items: SaleItem[]
  subtotal: number
  discount: number
  totalAmount: number
  tipoPagamento : PaymentMethod
  customerId?: string
  customerName?: string
  userId: string
  userName: string
  status: SaleStatus
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  productBarcode?: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "pix" | "check"

export type SaleStatus = "pending" | "completed" | "cancelled" | "refunded"

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  address?: string
  createdAt: string
}

export interface CashRegister {
  id: string
  user_id: string
  user_name: string
  opening_amount: number
  current_amount: number
  total_sales: number
  total_cash: number
  total_card: number
  total_pix: number
  is_open: boolean
  opened_at: string
  closed_at?: string
}
