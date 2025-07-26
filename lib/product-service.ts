import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface Filters {
  search?: string
  categoryId?: string
  supplierId?: string
  status?: "NORMAL" | "LOW" | "OUT_OF_STOCK"
  page?: number
  limit?: number
}

export async function getAllProducts(filters: Filters = {}) {
  try {
    const {
      search = "",
      categoryId = "",
      supplierId = "",
      status = "",
      page = 1,
      limit = 50,
    } = filters

    let whereClauses = []
    let params: any[] = []

    if (search) {
      whereClauses.push(`(LOWER(name) LIKE $${params.length + 1} OR codigo LIKE $${params.length + 1} OR barcode LIKE $${params.length + 1} OR LOWER(description) LIKE $${params.length + 1})`)
      params.push(`%${search.toLowerCase()}%`)
    }
    if (categoryId && categoryId !== "all") {
      whereClauses.push(`"categoryId" = $${params.length + 1}`)
      params.push(categoryId)
    }
    if (supplierId && supplierId !== "all") {
      whereClauses.push(`"supplierId" = $${params.length + 1}`)
      params.push(supplierId)
    }
    if (status && status !== "all") {
      if (status === "low_stock") {
        whereClauses.push(`"stockQuantity" <= "minStock" AND "stockQuantity" > 0`)
      } else if (status === "out_of_stock") {
        whereClauses.push(`"stockQuantity" = 0`)
      } else if (status === "active") {
        whereClauses.push(`"isActive" = true`)
      } else if (status === "inactive") {
        whereClauses.push(`"isActive" = false`)
      }
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""
    const offset = (page - 1) * limit
    const query = `
      SELECT *
      FROM products
      ${where}
      ORDER BY codigo, name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    console.log("[getAllProducts][RESTORED] query:", query)
    console.log("[getAllProducts][RESTORED] params:", params, "limit:", limit, "offset:", offset)
    const result = await sql.unsafe(query, [...params, limit, offset])
    const products = Array.isArray(result) ? result : result?.rows || []
    console.log("[getAllProducts][RESTORED] produtos retornados:", products.length)
    return products.map((p: any) => ({
      ...p,
      id: String(p.id),
      stockQuantity: Number(p.stockQuantity) || 0,
      minStock: Number(p.minStock) || 0,
      maxStock: Number(p.maxStock) || 0,
      costPrice: Number(p.costPrice) || 0,
      salePrice: Number(p.salePrice) || 0,
      isActive: Boolean(p.isActive),
    }))
  } catch (error) {
    console.error("[getAllProducts][RESTORED] ERRO:", error)
    throw error
  }
}

export async function getProductStats() {
  try {
    const [row] = await sql`
      SELECT
        COUNT(*)                                                            AS total,
        SUM(CASE WHEN "stockQuantity" <= "minStock" AND "stockQuantity" > 0 THEN 1 ELSE 0 END) AS low,
        SUM(CASE WHEN "stockQuantity" = 0                 THEN 1 ELSE 0 END) AS out,
        COALESCE(SUM("stockQuantity" * "costPrice"), 0)                       AS value,
        SUM(CASE WHEN "isActive" = true              THEN 1 ELSE 0 END)      AS active
      FROM products
    `
    return {
      totalProducts: Number(row.total) || 0,
      lowStockProducts: Number(row.low) || 0,
      outOfStockProducts: Number(row.out) || 0,
      totalValue: Number(row.value) || 0,
      activeProducts: Number(row.active) || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return {
      totalProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalValue: 0,
      activeProducts: 0,
    }
  }
}
