import { query } from "./db"
import { updateStock } from "./product-service"

export async function getSales(
  filters: {
    startDate?: string
    endDate?: string
    status?: string
  } = {},
) {
  try {
    let sql = "SELECT * FROM sales WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    // Adicionar filtros
    if (filters.startDate) {
      sql += ` AND created_at >= $${paramIndex}`
      params.push(filters.startDate)
      paramIndex++
    }

    if (filters.endDate) {
      sql += ` AND created_at <= $${paramIndex}`
      params.push(filters.endDate)
      paramIndex++
    }

    if (filters.status && filters.status !== "all") {
      sql += ` AND status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    // Ordenar por data (mais recente primeiro)
    sql += " ORDER BY created_at DESC"

    const sales = await query(sql, params)

    // Para cada venda, buscar os itens
    for (const sale of sales) {
      const items = await query("SELECT * FROM sale_items WHERE saleId = $1", [sale.id])
      sale.items = items
    }

    // Buscar clientes
    const customers = await query("SELECT * FROM customers")

    return {
      sales,
      customers,
    }
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    throw error
  }
}

export async function getSaleById(id: string) {
  try {
    const saleResult = await query("SELECT * FROM sales WHERE id = $1", [id])

    if (saleResult.length === 0) {
      return null
    }

    const sale = saleResult[0]

    // Buscar itens da venda
    const items = await query("SELECT * FROM sale_items WHERE saleId = $1", [id])

    sale.items = items

    return sale
  } catch (error) {
    console.error("Erro ao buscar venda:", error)
    return null
  }
}

export async function createSale(saleData: any, userId: string) {
  try {
    const { items, paymentMethod, customerId, customerName, discount = 0 } = saleData

    if (!items || items.length === 0) {
      throw new Error("Venda deve ter pelo menos um item")
    }

    // Verificar estoque disponível
    for (const item of items) {
      const productResult = await query("SELECT * FROM products WHERE id = $1", [item.productId])

      if (productResult.length === 0) {
        throw new Error(`Produto ${item.productName} não encontrado`)
      }

      const product = productResult[0]

      if (product.stockQuantity < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stockQuantity}`)
      }
    }

    // Calcular totais
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const total = subtotal - discount

    // Buscar informações do usuário
    const userResult = await query("SELECT * FROM users WHERE id = $1", [userId])
    const userName = userResult.length > 0 ? userResult[0].name : "Usuário"

    // Criar venda
    const saleResult = await query(
      `INSERT INTO sales (
        customer_id, customer_name, user_id, user_name,
        subtotal, discount, total, payment_method,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        customerId ?? null,
        customerName ?? null,
        userId,
        userName,
        subtotal,
        discount,
        total,
        paymentMethod,
        "completed",
      ],
    )

    const sale = saleResult[0]

    // Criar itens da venda COM código do produto
    const saleItems = []
    for (const item of items) {
      // Buscar código do produto
      const productResult = await query("SELECT codigo, barcode FROM products WHERE id = $1", [item.productId])
      const product = productResult[0]

      const saleItemResult = await query(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, product_barcode,
          quantity, unit_price, discount, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          sale.id,
          item.productId,
          item.productName,
          item.productBarcode || null,
          item.quantity,
          item.unitPrice,
          item.discount || 0,
          item.total,
        ],
      )

      // Adicionar código do produto ao item
      const saleItem = saleItemResult[0]
      saleItem.product_code = product?.codigo || null
      saleItem.product_barcode = product?.barcode || item.productBarcode
      saleItems.push(saleItem)

      // Atualizar estoque
      await updateStock(item.productId, "OUT", item.quantity, userId, "Venda", `VENDA-${sale.id}`)
    }

    // Adicionar CPF se fornecido
    if (saleData.includeCpf && saleData.cpfInput) {
      sale.cpfUsuario = saleData.cpfInput.replace(/\D/g, "")
    }

    // Retornar venda completa com itens
    return {
      ...sale,
      items: saleItems,
      paymentMethod: sale.payment_method,
      createdAt: sale.created_at,
      customerName: sale.customer_name,
    }
  } catch (error) {
    console.error("Erro ao criar venda:", error)
    throw error
  }
}

export async function updateSaleStatus(id: string, status: string, userId: string) {
  try {
    const saleResult = await query("SELECT * FROM sales WHERE id = $1", [id])

    if (saleResult.length === 0) {
      throw new Error("Venda não encontrada")
    }

    const sale = saleResult[0]

    // Se estiver cancelando uma venda, devolver itens ao estoque
    if (status === "cancelled" && sale.status === "completed") {
      // Buscar itens da venda
      const items = await query("SELECT * FROM sale_items WHERE sale_id = $1", [id])

      // Devolver cada item ao estoque
      for (const item of items) {
        await updateStock(item.product_id, "IN", item.quantity, userId, "Cancelamento de venda", `CANCEL-${id}`)
      }
    }

    // Atualizar status da venda
    await query("UPDATE sales SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status, id])

    // Buscar venda atualizada
    return await getSaleById(id)
  } catch (error) {
    console.error("Erro ao atualizar status da venda:", error)
    throw error
  }
}
