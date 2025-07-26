import { type NextRequest, NextResponse } from "next/server"
import { getAllProducts, getProductStats } from "@/lib/product-service"
import { neon } from "@neondatabase/serverless"
import { nanoid } from "nanoid"

export const runtime = "nodejs" // necessário para usar neon em modo HTTP

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  console.log("------------------------------------*****************************")
  try {
    const { searchParams } = new URL(req.url)
    console.log("searchParams:****************************************", searchParams)
    const page = Number.parseInt(searchParams.get("page") ?? "1")
    const limit = Number.parseInt(searchParams.get("limit") ?? "50")
    const search = searchParams.get("search") ?? ""
    const category = searchParams.get("category") ?? ""
    const supplier = searchParams.get("supplier") ?? ""
    const status = searchParams.get("status") ?? ""
    console.log("searchParams://////////////////////", { page, limit, search, category, supplier, status })
    console.log("🔍 Tipo do category:", typeof category, "Valor:", category)
    const all = await getAllProducts({
      search,
      categoryId: category,
      supplierId: supplier,
      status: status as any,
    })
    console.log("all products:***********************", all.length)
    const start = (page - 1) * limit
    const products = all.slice(start, start + limit)

    const stats = await getProductStats()

    const rawCategories = await sql`SELECT id, name FROM categories ORDER BY name`
    console.log("🔍 Categorias do banco:", rawCategories)
    const categories = rawCategories.map((c) => ({
      id: String(c.id), // Manter como string para compatibilidade
      name: c.name,
    }))
    console.log("🔍 Categorias processadas:", categories)

    const rawSuppliers = await sql`SELECT id, name FROM suppliers ORDER BY name`
    console.log("🔍 Fornecedores do banco:", rawSuppliers)
    const suppliers = rawSuppliers.map((s) => ({
      id: String(s.id), // Manter como string para compatibilidade
      name: s.name,
    }))
    console.log("🔍 Fornecedores processados:", suppliers)

    console.log("/api/products:", {
      page: page,
      limit: limit,
      search: search,
      category: category,
      supplier: supplier,
      status: status,
    })

    return NextResponse.json({
      products,
      stats,
      categories,
      suppliers,
    })
  } catch (err) {
    return NextResponse.json({ error: "Error internal server" }, { status: 500 })
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let id = body.id ?? nanoid() 
    const {
      name,
      barcode,
      category,
      supplier,
      stockQuantity,
      minStock,
      maxStock,
      costPrice,
      salePrice,
      isActive = true,
      status = 'NORMAL',
      description,
      codigo,
    } = body

    const categoryResult = await sql`SELECT id FROM categories WHERE name = ${category}`
    const supplierResult = await sql`SELECT id FROM suppliers WHERE name = ${supplier}`

    if (categoryResult.length === 0) {
      return NextResponse.json({ error: `Categoria '${category}' não encontrada` }, { status: 400 })
    }

    if (supplierResult.length === 0) {
      return NextResponse.json({ error: `Fornecedor '${supplier}' não encontrado` }, { status: 400 })
    }

    const categoryId = categoryResult[0].id
    const supplierId = supplierResult[0].id


    console.log('Dados recebidos:', {
      id,
      name,
      barcode,
      categoryId,
      supplierId,
      stockQuantity,
      minStock,
      maxStock,
      costPrice,
      salePrice,
      isActive,
      status,
      description,
      codigo
    })
    if (
      !id ||
      !name ||
      !categoryId ||
      !supplierId ||
      stockQuantity === undefined ||
      minStock === undefined ||
      maxStock === undefined ||
      costPrice === undefined ||
      salePrice === undefined
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes" },
        { status: 400 }
      )
    }

    await sql`
      INSERT INTO products (
        id,
        name,
        barcode,
        "categoryId",
        "supplierId",
        "stockQuantity",
        "minStock",
        "maxStock",
        "costPrice",
        "salePrice",
        "isActive",
        status,
        description,
        codigo,
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${name},
        ${barcode},
        ${categoryId},
        ${supplierId},
        ${stockQuantity},
        ${minStock},
        ${maxStock},
        ${costPrice},
        ${salePrice},
        ${isActive},
        ${status},
        ${description},
        ${codigo},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `

    return NextResponse.json({ message: "Produto criado com sucesso" }, { status: 201 })
  } catch (err) {
    console.error("Erro no POST /api/products:", err)
    return NextResponse.json({ error: "Erro interno ao criar produto" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      name,
      barcode,
      category,
      supplier,
      stockQuantity,
      minStock,
      maxStock,
      costPrice,
      salePrice,
      isActive = true,
      status = 'NORMAL',
      description,
      codigo,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
    }

    const categoryResult = await sql`SELECT id FROM categories WHERE name = ${category}`
    const supplierResult = await sql`SELECT id FROM suppliers WHERE name = ${supplier}`

    if (categoryResult.length === 0) {
      return NextResponse.json({ error: `Categoria '${category}' não encontrada` }, { status: 400 })
    }
    if (supplierResult.length === 0) {
      return NextResponse.json({ error: `Fornecedor '${supplier}' não encontrado` }, { status: 400 })
    }
    const categoryId = categoryResult[0].id
    const supplierId = supplierResult[0].id

    await sql`
      UPDATE products SET
        name = ${name},
        barcode = ${barcode},
        "categoryId" = ${categoryId},
        "supplierId" = ${supplierId},
        "stockQuantity" = ${stockQuantity},
        "minStock" = ${minStock},
        "maxStock" = ${maxStock},
        "costPrice" = ${costPrice},
        "salePrice" = ${salePrice},
        "isActive" = ${isActive},
        status = ${status},
        description = ${description},
        codigo = ${codigo},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ message: 'Produto atualizado com sucesso' })
  } catch (err) {
    console.error('Erro no PUT /api/products:', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar produto' }, { status: 500 })
  }
}
