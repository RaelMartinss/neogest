import { mockProducts } from "@/app/data/mockData"
import { mockCashRegisters } from "@/app/data/salesData"

export interface SystemAlert {
  type: "info" | "warning" | "error"
  message: string
  source: string
  timestamp: string
}

export function generateSystemAlerts(): SystemAlert[] {
  const alerts: SystemAlert[] = []
  const now = new Date().toISOString()

  // Alertas de estoque baixo
  const lowStockProducts = mockProducts.filter((p) => p.stockQuantity <= p.minStock && p.stockQuantity > 0)
  if (lowStockProducts.length > 0) {
    alerts.push({
      type: "warning",
      message: `${lowStockProducts.length} produtos com estoque baixo`,
      source: "estoque",
      timestamp: now,
    })

    // Adicionar alertas específicos para produtos críticos
    lowStockProducts.slice(0, 3).forEach((product) => {
      alerts.push({
        type: "warning",
        message: `Estoque baixo: ${product.name} (${product.stockQuantity}/${product.minStock})`,
        source: "estoque",
        timestamp: now,
      })
    })
  }

  // Alertas de produtos sem estoque
  const outOfStockProducts = mockProducts.filter((p) => p.stockQuantity === 0 && p.isActive)
  if (outOfStockProducts.length > 0) {
    alerts.push({
      type: "error",
      message: `${outOfStockProducts.length} produtos sem estoque`,
      source: "estoque",
      timestamp: now,
    })
  }

  // Alertas de caixa
  const openCashRegisters = mockCashRegisters.filter((cr) => cr.isOpen)
  if (openCashRegisters.length > 0) {
    alerts.push({
      type: "info",
      message: `${openCashRegisters.length} caixa(s) aberto(s)`,
      source: "caixa",
      timestamp: now,
    })
  }

  // Simular outros alertas para demonstração
  if (Math.random() > 0.7) {
    alerts.push({
      type: "info",
      message: "Backup automático realizado com sucesso",
      source: "sistema",
      timestamp: now,
    })
  }

  if (Math.random() > 0.9) {
    alerts.push({
      type: "error",
      message: "Falha na sincronização do produto #1234",
      source: "sistema",
      timestamp: now,
    })
  }

  return alerts
}
