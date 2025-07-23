import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Customer {
  id: string
  name: string
  email?: string
  cpf_cnpj?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipcode?: string
  birth_date?: string
  notes?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface CustomerStats {
  totalPurchases: number
  totalSpent: number
  averageTicket: number
  lastPurchase?: string
  frequencyDays: number
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats
}

export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const customers = await sql`
      SELECT * FROM customers 
      WHERE is_active = true 
      ORDER BY name ASC
    `
    return customers as Customer[]
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const result = await sql`
      SELECT * FROM customers 
      WHERE id = ${id} AND is_active = true
    `
    return (result[0] as Customer) || null
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return null
  }
}

export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as average_ticket,
        MAX(created_at) as last_purchase
      FROM sales 
      WHERE "customerId" = ${customerId}
    `

    const result = stats[0]

    // Calcular frequência (dias entre primeira e última compra / número de compras)
    const frequencyQuery = await sql`
      SELECT 
        EXTRACT(DAYS FROM (MAX(created_at) - MIN(created_at))) as days_span
      FROM sales 
      WHERE "customerId" = ${customerId}
    `

    const daysSpan = frequencyQuery[0]?.days_span || 0
    const totalPurchases = Number.parseInt(result.total_purchases) || 0
    const frequencyDays = totalPurchases > 1 ? Math.round(daysSpan / (totalPurchases - 1)) : 0

    return {
      totalPurchases,
      totalSpent: Number.parseFloat(result.total_spent) || 0,
      averageTicket: Number.parseFloat(result.average_ticket) || 0,
      lastPurchase: result.last_purchase,
      frequencyDays,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do cliente:", error)
    return {
      totalPurchases: 0,
      totalSpent: 0,
      averageTicket: 0,
      frequencyDays: 0,
    }
  }
}

export async function getCustomerPurchases(customerId: string) {
  try {
    const purchases = await sql`
      SELECT 
        s.*,
        si.product_name,
        si.quantity,
        si.unit_price,
        si.total as item_total
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s."customerId" = ${customerId}
      ORDER BY s.created_at DESC
    `

    // Agrupar itens por venda
    const salesMap = new Map()

    purchases.forEach((row: any) => {
      if (!salesMap.has(row.id)) {
        salesMap.set(row.id, {
          id: row.id,
          number: row.number,
          total: row.total,
          paymentMethod: row.paymentMethod,
          created_at: row.created_at,
          items: [],
        })
      }

      if (row.product_name) {
        salesMap.get(row.id).items.push({
          product_name: row.product_name,
          quantity: row.quantity,
          unit_price: row.unit_price,
          total: row.item_total,
        })
      }
    })

    return Array.from(salesMap.values())
  } catch (error) {
    console.error("Erro ao buscar compras do cliente:", error)
    return []
  }
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  try {
    const customers = await sql`
      SELECT * FROM customers 
      WHERE is_active = true 
      AND (
        name ILIKE ${"%" + query + "%"} OR
        email ILIKE ${"%" + query + "%"} OR
        cpf_cnpj ILIKE ${"%" + query + "%"} OR
        phone ILIKE ${"%" + query + "%"}
      )
      ORDER BY name ASC
      LIMIT 50
    `
    return customers as Customer[]
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer | null> {
  try {
    const result = await sql`
      INSERT INTO customers (
        name, email, cpf_cnpj, phone, address, city, state, zipcode, birth_date, notes
      ) VALUES (
        ${customerData.name},
        ${customerData.email || null},
        ${customerData.cpf_cnpj || null},
        ${customerData.phone || null},
        ${customerData.address || null},
        ${customerData.city || null},
        ${customerData.state || null},
        ${customerData.zipcode || null},
        ${customerData.birth_date || null},
        ${customerData.notes || null}
      )
      RETURNING *
    `
    return result[0] as Customer
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return null
  }
}

export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer | null> {
  try {
    const result = await sql`
      UPDATE customers SET
        name = ${customerData.name},
        email = ${customerData.email || null},
        cpf_cnpj = ${customerData.cpf_cnpj || null},
        phone = ${customerData.phone || null},
        address = ${customerData.address || null},
        city = ${customerData.city || null},
        state = ${customerData.state || null},
        zipcode = ${customerData.zipcode || null},
        birth_date = ${customerData.birth_date || null},
        notes = ${customerData.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    return (result[0] as Customer) || null
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return null
  }
}
