import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface Filters {
  search?: string
  categoryId?: string
  supplierId?: string
  status?: "NORMAL" | "LOW" | "OUT_OF_STOCK"
}

/**
 * Busca todos os produtos e aplica filtros no JavaScript.
 */
export async function getAllProducts(filters: Filters = {}) {
  let prod = await sql`SELECT * FROM products`;
  
  // Seleciona com snake_case e cria alias camelCase
  let products = await sql`
    SELECT
      p.id,
      p.codigo,
      p.name,
      p.barcode,
      p.description,
      p."categoryId"      AS "categoryId",
      p."supplierId"      AS "supplierId",
      p."stockQuantity"   AS "stockQuantity",
      p."minStock"        AS "minStock",
      p."maxStock"        AS "maxStock",
      p."costPrice"       AS "costPrice",
      p."salePrice"       AS "salePrice",
      p."isActive"        AS "isActive",
      p.status,
      p."createdAt"       AS "createdAt",
      p."updatedAt"       AS "updatedAt",
      c.name             AS "categoryName",
      s.name             AS "supplierName"
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    LEFT JOIN suppliers  s ON p."supplierId" = s.id
    ORDER BY p.codigo, p.name
  ` 


  console.log("🔎 Total produtos do banco antes dos filtros:", products.length)


  const { search = "", categoryId = "", supplierId = "", status = "" } = filters

  // ---------- filtros no JS ----------
  if (search) {
    const t = search.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        (p.codigo && p.codigo.includes(t)) ||
        (p.barcode && p.barcode.includes(t)) ||
        (p.description && p.description.toLowerCase().includes(t)),
    )
  }

  if (categoryId && categoryId !== "all") {
    console.log("🔍 Filtrando por categoria:", categoryId, "tipo:", typeof categoryId)
    console.log("🔍 Produtos antes do filtro:", products.length)
    console.log("🔍 Exemplos de categoryId dos produtos:", products.slice(0, 3).map(p => ({ 
      id: p.id, 
      categoryId: p.categoryId, 
      categoryIdType: typeof p.categoryId,
      categoryName: p.categoryName 
    })))
    
    // Testar diferentes formas de comparação
    const filtered1 = products.filter((p) => String(p.categoryId) === categoryId)
    const filtered2 = products.filter((p) => p.categoryId === categoryId)
    const filtered3 = products.filter((p) => String(p.categoryId) === String(categoryId))
    
    console.log("🔍 Comparação String(p.categoryId) === categoryId:", filtered1.length)
    console.log("🔍 Comparação p.categoryId === categoryId:", filtered2.length)
    console.log("🔍 Comparação String(p.categoryId) === String(categoryId):", filtered3.length)
    
    products = products.filter((p) => String(p.categoryId) === categoryId)
    
    console.log("🔍 Produtos após filtro de categoria:", products.length)
    console.log("🔍 Produtos filtrados:", products.map(p => ({ id: p.id, name: p.name, categoryId: p.categoryId, categoryName: p.categoryName })))
  }
  
  if (supplierId && supplierId !== "all") {
    products = products.filter((p) => String(p.supplierId) === supplierId)
  }

  if (status && status !== "all") {
    switch (status) {
      case "low_stock":
        products = products.filter((p) => p.stockQuantity <= p.minStock && p.stockQuantity > 0)
        break
      case "out_of_stock":
        products = products.filter((p) => p.stockQuantity === 0)
        break
      case "active":
        products = products.filter((p) => p.isActive === true)
        break
      case "inactive":
        products = products.filter((p) => p.isActive === false)
        break
    }
  }

  // normalizar numéricos e converter BigInt
  return products.map((p) => ({
    ...p,
    id: String(p.id),
    codigo: p.codigo || "",
    categoryId: p.categoryId ? String(p.categoryId) : null,
    supplierId: p.supplierId ? String(p.supplierId) : null,
    categoryName: p.categoryName || null,
    supplierName: p.supplierName || null,
    stockQuantity: Number(p.stockQuantity) || 0,
    minStock: Number(p.minStock) || 0,
    maxStock: Number(p.maxStock) || 0,
    costPrice: Number(p.costPrice) || 0,
    salePrice: Number(p.salePrice) || 0,
    isActive: Boolean(p.isActive),
  }))
  
}

export async function getProductStats() {
  console.log("🔍 Buscando estatísticas dos produtos...++++++++++++++++++++++++++++++++++++++++++++")
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
