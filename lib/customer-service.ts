import { neon } from "@neondatabase/serverless"
import { nanoid } from "nanoid"

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
  notes?: string
  createdAt: string
  updatedAt: string
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

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

// Função para validar CNPJ
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  let digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  let digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false
  
  return true
}

// Função para validar CPF ou CNPJ
export function validateCPFCNPJ(value: string): boolean {
  const cleanValue = value.replace(/\D/g, '')
  
  if (cleanValue.length === 11) {
    return validateCPF(value)
  } else if (cleanValue.length === 14) {
    return validateCNPJ(value)
  }
  
  return false
}

// Função para formatar CPF/CNPJ
export function formatCPFCNPJ(value: string): string {
  const cleanValue = value.replace(/\D/g, '')
  
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleanValue.length === 14) {
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return value
}

export async function getAllCustomers(): Promise<Customer[]> {
  try {
    console.log("🔄 getAllCustomers - Executando query...")
    const customers = await sql`
      SELECT * FROM customers 
      WHERE is_active = true 
      ORDER BY name ASC
    `
    console.log(`✅ getAllCustomers - Encontrados ${customers.length} clientes`)
    console.log("📋 Primeiros clientes:", customers.slice(0, 3).map(c => ({ id: c.id, name: c.name, is_active: c.is_active })))
    return customers as Customer[]
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error)
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
    console.log(`🔍 Buscando clientes com query: "${query}"`)
    
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
    
    console.log(`✅ Encontrados ${customers.length} clientes`)
    return customers as Customer[]
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer | null> {
  try {
    console.log("📝 Criando cliente:", customerData)
    
    // Validar dados obrigatórios
    if (!customerData.name || customerData.name.trim() === '') {
      throw new Error("Nome é obrigatório")
    }
    
    // Validar CPF/CNPJ se fornecido
    if (customerData.cpf_cnpj && customerData.cpf_cnpj.trim() !== '') {
      if (!validateCPFCNPJ(customerData.cpf_cnpj)) {
        throw new Error("CPF/CNPJ inválido")
      }
    }
    
    // Verificar se CPF/CNPJ já existe
    if (customerData.cpf_cnpj && customerData.cpf_cnpj.trim() !== '') {
      const existingCustomer = await sql`
        SELECT id FROM customers 
        WHERE cpf_cnpj = ${customerData.cpf_cnpj} AND is_active = true
      `
      if (existingCustomer.length > 0) {
        throw new Error("CPF/CNPJ já cadastrado")
      }
    }
    
    // Verificar se email já existe
    if (customerData.email && customerData.email.trim() !== '') {
      const existingCustomer = await sql`
        SELECT id FROM customers 
        WHERE email = ${customerData.email} AND is_active = true
      `
      if (existingCustomer.length > 0) {
        throw new Error("Email já cadastrado")
      }
    }

    // Gerar ID único para o cliente
    const customerId = nanoid()
    console.log("🆔 ID gerado para cliente:", customerId)

    const result = await sql`
      INSERT INTO customers (
        id, name, email, cpf_cnpj, phone, "address", city, state, zipcode, notes, "createdAt", "updatedAt", is_active
      ) VALUES (
        ${customerId},
        ${customerData.name},
        ${customerData.email || null},
        ${customerData.cpf_cnpj || null},
        ${customerData.phone || null},
        ${customerData.address || null},
        ${customerData.city || null},
        ${customerData.state || null},
        ${customerData.zipcode || null},
        ${customerData.notes || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        true
      )
      RETURNING *
    `
    
    console.log("✅ Cliente criado com sucesso:", result[0])
    return result[0] as Customer
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error)
    throw error
  }
}

export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer | null> {
  try {
    console.log(`📝 Atualizando cliente ${id}:`, customerData)
    
    // Validar dados obrigatórios
    if (!customerData.name || customerData.name.trim() === '') {
      throw new Error("Nome é obrigatório")
    }
    
    // Validar CPF/CNPJ se fornecido
    if (customerData.cpf_cnpj && customerData.cpf_cnpj.trim() !== '') {
      if (!validateCPFCNPJ(customerData.cpf_cnpj)) {
        throw new Error("CPF/CNPJ inválido")
      }
    }
    
    // Verificar se CPF/CNPJ já existe em outro cliente
    if (customerData.cpf_cnpj && customerData.cpf_cnpj.trim() !== '') {
      const existingCustomer = await sql`
        SELECT id FROM customers 
        WHERE cpf_cnpj = ${customerData.cpf_cnpj} AND id != ${id} AND is_active = true
      `
      if (existingCustomer.length > 0) {
        throw new Error("CPF/CNPJ já cadastrado em outro cliente")
      }
    }
    
    // Verificar se email já existe em outro cliente
    if (customerData.email && customerData.email.trim() !== '') {
      const existingCustomer = await sql`
        SELECT id FROM customers 
        WHERE email = ${customerData.email} AND id != ${id} AND is_active = true
      `
      if (existingCustomer.length > 0) {
        throw new Error("Email já cadastrado em outro cliente")
      }
    }

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
        notes = ${customerData.notes || null},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    
    console.log("✅ Cliente atualizado com sucesso:", result[0])
    return (result[0] as Customer) || null
  } catch (error) {
    console.error("❌ Erro ao atualizar cliente:", error)
    throw error
  }
}
