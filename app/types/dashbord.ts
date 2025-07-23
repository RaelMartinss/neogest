interface DashboardStat {
  title: string
  value: string
  icon: string
  change: string
  changeType: string
  subtitle?: string
}

interface DashboardAlert {
  type: string
  message: string
}

interface RecentSale {
  id: string
  saleNumber: string
  customerName: string
  total: number
  paymentMethod: string
  status: string
  createdAt: string
  duration?: number
}

interface SalesByDay {
  date: string
  count: number
  total: number
  day: string
}

interface SalesByHour {
  hour: string
  count: number
  total: number
}


interface TopProduct {
  name: string
  quantity: number
  salesCount: number
  stockDays?: number
}

interface TopCustomer {
  name: string
  totalPurchases: number
  lastPurchase: string
  frequency: number
}

interface TopSeller {
  name: string
  sales: number
  total: number
}

interface PaymentMethod {
  method: string
  count: number
  total: number
}

interface ProfitData {
  grossProfit: number
  profitMargin: number
  costOfGoods: number
}

interface ReceivableData {
  amount: number
  daysToReceive: number
  method: string
}