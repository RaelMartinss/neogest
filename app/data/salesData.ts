import type { Sale, Customer, CashRegister } from "../types/sale"

export const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-1111",
    cpf: "123.456.789-00",
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@email.com",
    phone: "(11) 99999-2222",
    cpf: "987.654.321-00",
    createdAt: "2024-01-02T11:00:00Z",
  },
]

export const mockSales: Sale[] = [
  {
    id: "1",
    items: [
      {
        id: "1",
        productId: "1",
        productName: "Coca-Cola 350ml",
        productBarcode: "7894900011517",
        quantity: 2,
        unitPrice: 4.5,
        discount: 0,
        total: 9.0,
      },
      {
        id: "2",
        productId: "4",
        productName: "Arroz Branco 5kg",
        productBarcode: "7891234567892",
        quantity: 1,
        unitPrice: 18.9,
        discount: 0,
        total: 18.9,
      },
    ],
    subtotal: 27.9,
    discount: 0,
    total: 27.9,
    paymentMethod: "cash",
    customerId: "1",
    customerName: "João Silva",
    userId: "3",
    userName: "Maria Operadora",
    status: "completed",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
  },
]

export const mockCashRegisters: CashRegister[] = [
  {
    id: "1",
    userId: "3",
    userName: "Maria Operadora",
    openingAmount: 500.0,
    currentAmount: 1250.0,
    totalSales: 750.0,
    totalCash: 450.0,
    totalCard: 200.0,
    totalPix: 100.0,
    isOpen: true,
    openedAt: "2024-01-15T08:00:00Z",
  },
]
