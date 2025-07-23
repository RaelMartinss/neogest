// Usuários de demonstração disponíveis:
export const mockUsers = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@empresa.com",
    password: "admin123",
    role: "ADMIN",
    permissions: ["dashboard", "pdv", "caixa", "estoque", "relatorios", "usuarios", "configuracoes"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
  },
  {
    id: "2",
    name: "Gerente",
    email: "gerente@empresa.com",
    password: "gerente123",
    role: "MANAGER",
    permissions: ["dashboard", "pdv", "caixa", "estoque", "relatorios"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
  },
  {
    id: "3",
    name: "Operadora de Caixa",
    email: "operadora@empresa.com",
    password: "operadora123",
    role: "CASHIER",
    permissions: ["pdv", "caixa"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
  },
  {
    id: "4",
    name: "Gestor de Estoque",
    email: "estoque@empresa.com",
    password: "estoque123",
    role: "STOCK_MANAGER",
    permissions: ["dashboard", "estoque", "relatorios"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
  },
]

// Produtos de demonstração
export const mockProducts = [
  {
    id: "1",
    name: "Produto A",
    description: "Descrição do produto A",
    price: 10.50,
    stockQuantity: 100,
    minStock: 10,
    isActive: true,
    category: "Categoria 1",
    barcode: "123456789",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Produto B",
    description: "Descrição do produto B",
    price: 25.00,
    stockQuantity: 50,
    minStock: 5,
    isActive: true,
    category: "Categoria 2",
    barcode: "987654321",
    createdAt: new Date("2024-01-01"),
  },
]

// Movimentos de estoque de demonstração
export const mockStockMovements = [
  {
    id: "1",
    productId: "1",
    type: "ENTRADA",
    quantity: 100,
    reason: "Compra inicial",
    operatorId: "1",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    productId: "1",
    type: "SAIDA",
    quantity: 10,
    reason: "Venda",
    operatorId: "3",
    createdAt: new Date("2024-01-15"),
  },
]

// Logs de auditoria de demonstração
export const mockAuditLogs = [
  {
    id: "1",
    userId: "1",
    action: "LOGIN",
    details: "Login realizado com sucesso",
    ipAddress: "192.168.1.1",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    userId: "3",
    action: "SALE_CREATED",
    details: "Venda criada: #001",
    ipAddress: "192.168.1.2",
    createdAt: new Date("2024-01-15"),
  },
]
