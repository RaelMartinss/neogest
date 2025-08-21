import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const supplierId = searchParams.get("supplierId") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    console.log("Filtros recebidos:", {
      search,
      categoryId,
      supplierId,
      status,
      page,
      limit,
      offset,
    });

    // Buscar produtos com filtros usando múltiplas queries condicionais
    let products: any[] = [];

    if (!search && !categoryId && !supplierId && !status) {
      // Query sem filtros
      products = await sql`
        SELECT 
          p.id,
          p.codigo,
          p.name,
          p.barcode,
          p.description,
          p.category_id as "categoryId",
          p.supplier_id as "supplierId",
          p.stock_quantity as "stockQuantity",
          p.min_stock as "minStock",
          p.max_stock as "maxStock",
          p.cost_price as "costPrice",
          p.sale_price as "salePrice",
          p.unit,
          p.is_active as "isActive",
          p.status,
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          c.name as "categoryName",
          s.name as "supplierName"
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.codigo, p.name
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Query com filtros - vamos construir condicionalmente
      if (search && !categoryId && !supplierId && !status) {
        products = await sql`
          SELECT 
            p.id,
            p.codigo,
            p.name,
            p.barcode,
            p.description,
            p.category_id as "categoryId",
            p.supplier_id as "supplierId",
            p.stock_quantity as "stockQuantity",
            p.min_stock as "minStock",
            p.max_stock as "maxStock",
            p.cost_price as "costPrice",
            p.sale_price as "salePrice",
            p.unit,
            p.is_active as "isActive",
            p.status,
            p.created_at as "createdAt",
            p.updated_at as "updatedAt",
            c.name as "categoryName",
            s.name as "supplierName"
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE (
            LOWER(p.name) LIKE LOWER(${`%${search}%`}) OR 
            p.codigo LIKE ${`%${search}%`} OR 
            p.barcode LIKE ${`%${search}%`} OR
            LOWER(p.description) LIKE LOWER(${`%${search}%`})
          )
          ORDER BY p.codigo, p.name
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (
        categoryId &&
        categoryId !== "all" &&
        !search &&
        !supplierId &&
        !status
      ) {
        products = await sql`
          SELECT 
            p.id,
            p.codigo,
            p.name,
            p.barcode,
            p.description,
            p.category_id as "categoryId",
            p.supplier_id as "supplierId",
            p.stock_quantity as "stockQuantity",
            p.min_stock as "minStock",
            p.max_stock as "maxStock",
            p.cost_price as "costPrice",
            p.sale_price as "salePrice",
            p.unit,
            p.is_active as "isActive",
            p.status,
            p.created_at as "createdAt",
            p.updated_at as "updatedAt",
            c.name as "categoryName",
            s.name as "supplierName"
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.category_id = ${Number.parseInt(categoryId)}
          ORDER BY p.codigo, p.name
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (
        status &&
        status !== "all" &&
        !search &&
        !categoryId &&
        !supplierId
      ) {
        // Filtro por status
        if (status === "active") {
          products = await sql`
            SELECT 
              p.id,
              p.codigo,
              p.name,
              p.barcode,
              p.description,
              p.category_id as "categoryId",
              p.supplier_id as "supplierId",
              p.stock_quantity as "stockQuantity",
              p.min_stock as "minStock",
              p.max_stock as "maxStock",
              p.cost_price as "costPrice",
              p.sale_price as "salePrice",
              p.unit,
              p.is_active as "isActive",
              p.status,
              p.created_at as "createdAt",
              p.updated_at as "updatedAt",
              c.name as "categoryName",
              s.name as "supplierName"
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.is_active = true
            ORDER BY p.codigo, p.name
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else if (status === "inactive") {
          products = await sql`
            SELECT 
              p.id,
              p.codigo,
              p.name,
              p.barcode,
              p.description,
              p.category_id as "categoryId",
              p.supplier_id as "supplierId",
              p.stock_quantity as "stockQuantity",
              p.min_stock as "minStock",
              p.max_stock as "maxStock",
              p.cost_price as "costPrice",
              p.sale_price as "salePrice",
              p.unit,
              p."is_active" as "isActive",
              p.status,
              p.created_at as "createdAt",
              p.updated_at as "updatedAt",
              c.name as "categoryName",
              s.name as "supplierName"
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p."is_active" = false
            ORDER BY p.codigo, p.name
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else if (status === "low_stock") {
          products = await sql`
            SELECT 
              p.id,
              p.codigo,
              p.name,
              p.barcode,
              p.description,
              p.category_id as "categoryId",
              p.supplier_id as "supplierId",
              p.stock_quantity as "stockQuantity",
              p.min_stock as "minStock",
              p.max_stock as "maxStock",
              p.cost_price as "costPrice",
              p.sale_price as "salePrice",
              p.unit,
              p."is_active" as "isActive",
              p.status,
              p.created_at as "createdAt",
              p.updated_at as "updatedAt",
              c.name as "categoryName",
              s.name as "supplierName"
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.stock_quantity <= p.min_stock AND p.stock_quantity > 0
            ORDER BY p.codigo, p.name
            LIMIT ${limit} OFFSET ${offset}
          `;
        } else if (status === "out_of_stock") {
          products = await sql`
            SELECT 
              p.id,
              p.codigo,
              p.name,
              p.barcode,
              p.description,
              p.category_id as "categoryId",
              p.supplier_id as "supplierId",
              p.stock_quantity as "stockQuantity",
              p.min_stock as "minStock",
              p.max_stock as "maxStock",
              p.cost_price as "costPrice",
              p.sale_price as "salePrice",
              p.unit,
              p."is_active" as "isActive",
              p.status,
              p.created_at as "createdAt",
              p.updated_at as "updatedAt",
              c.name as "categoryName",
              s.name as "supplierName"
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.stock_quantity = 0
            ORDER BY p.codigo, p.name
            LIMIT ${limit} OFFSET ${offset}
          `;
        }
      } else {
        // Filtros combinados - query mais complexa
        products = await sql`
          SELECT 
            p.id,
            p.codigo,
            p.name,
            p.barcode,
            p.description,
            p.category_id as "categoryId",
            p.supplier_id as "supplierId",
            p.stock_quantity as "stockQuantity",
            p.min_stock as "minStock",
            p.max_stock as "maxStock",
            p.cost_price as "costPrice",
            p.sale_price as "salePrice",
            p.unit,
            p."is_active" as "isActive",
            p.status,
            p.created_at as "createdAt",
            p.updated_at as "updatedAt",
            c.name as "categoryName",
            s.name as "supplierName"
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          ORDER BY p.codigo, p.name
        `;

        // Aplicar filtros no JavaScript para casos complexos
        if (search) {
          const searchLower = search.toLowerCase();
          products = products.filter(
            (p: any) =>
              p.name?.toLowerCase().includes(searchLower) ||
              p.codigo?.includes(search) ||
              p.barcode?.includes(search) ||
              p.description?.toLowerCase().includes(searchLower)
          );
        }

        if (categoryId && categoryId !== "all") {
          products = products.filter(
            (p: any) => p.categoryId === Number.parseInt(categoryId)
          );
        }

        if (supplierId && supplierId !== "all") {
          products = products.filter(
            (p: any) => p.supplierId === Number.parseInt(supplierId)
          );
        }

        if (status && status !== "all") {
          products = products.filter((p: any) => {
            switch (status) {
              case "active":
                return p.isActive === true;
              case "inactive":
                return p.isActive === false;
              case "low_stock":
                return p.stock_quantity <= p.minStock && p.stock_quantity > 0;
              case "out_of_stock":
                return p.stock_quantity === 0;
              default:
                return true;
            }
          });
        }
      }
    }

    console.log(`Encontrados ${products.length} produtos`);

    // Buscar estatísticas
    const statsResult = await sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN stock_quantity <= min_stock AND stock_quantity > 0 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out,
        COALESCE(SUM(stock_quantity * cost_price), 0) as value,
        SUM(CASE WHEN "is_active" = true THEN 1 ELSE 0 END) as active
      FROM products
    `;

    const stats = {
      totalProducts: Number(statsResult[0].total) || 0,
      lowStockProducts: Number(statsResult[0].low) || 0,
      outOfStockProducts: Number(statsResult[0].out) || 0,
      totalValue: Number(statsResult[0].value) || 0,
      activeProducts: Number(statsResult[0].active) || 0,
    };

    // Buscar categorias
    const categories = await sql`
      SELECT id, name FROM categories ORDER BY name
    `;

    // Buscar fornecedores
    const suppliers = await sql`
      SELECT id, name FROM suppliers ORDER BY name
    `;

    // Buscar unidades de medida
          const units = await sql`
        SELECT code, name FROM units ORDER BY name
      `;

    // Contar total de produtos para paginação
    let totalCount = 0;
    if (!search && !categoryId && !supplierId && !status) {
      const countResult = await sql`SELECT COUNT(*) as total FROM products`;
      totalCount = Number(countResult[0].total);
    } else if (search && !categoryId && !supplierId && !status) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM products p
        WHERE (
          LOWER(p.name) LIKE LOWER(${`%${search}%`}) OR 
          p.codigo LIKE ${`%${search}%`} OR 
          p.barcode LIKE ${`%${search}%`} OR
          LOWER(p.description) LIKE LOWER(${`%${search}%`})
        )
      `;
      totalCount = Number(countResult[0].total);
    } else if (categoryId && categoryId !== "all" && !search && !supplierId && !status) {
      const countResult = await sql`
        SELECT COUNT(*) as total FROM products WHERE category_id = ${Number.parseInt(categoryId)}
      `;
      totalCount = Number(countResult[0].total);
    } else if (status && status !== "all" && !search && !categoryId && !supplierId) {
      if (status === "active") {
        const countResult = await sql`SELECT COUNT(*) as total FROM products WHERE is_active = true`;
        totalCount = Number(countResult[0].total);
      } else if (status === "inactive") {
        const countResult = await sql`SELECT COUNT(*) as total FROM products WHERE "is_active" = false`;
        totalCount = Number(countResult[0].total);
      } else if (status === "low_stock") {
        const countResult = await sql`
          SELECT COUNT(*) as total FROM products 
          WHERE stock_quantity <= min_stock AND stock_quantity > 0
        `;
        totalCount = Number(countResult[0].total);
      } else if (status === "out_of_stock") {
        const countResult = await sql`SELECT COUNT(*) as total FROM products WHERE stock_quantity = 0`;
        totalCount = Number(countResult[0].total);
      }
    } else {
      // Para filtros combinados, usar contagem aproximada
      totalCount = products.length;
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Garantir que products é um array e normalizar dados
    const productsArray = Array.isArray(products) ? products : [];
    const normalizedProducts = productsArray.map((p: any) => ({
      ...p,
      id: String(p.id),
      codigo: p.codigo || "",
      categoryId: p.categoryId ? String(p.categoryId) : null,
      supplierId: p.supplierId ? String(p.supplierId) : null,
      stockQuantity: Number(p.stockQuantity) || 0,
      minStock: Number(p.minStock) || 0,
      maxStock: Number(p.maxStock) || 0,
      costPrice: Number(p.costPrice) || 0,
      salePrice: Number(p.salePrice) || 0,
      isActive: Boolean(p.isActive),
      unit: p.unit || "UN",
      category: p.categoryName || "Sem categoria",
      supplier: p.supplierName || "Sem fornecedor",
    }));

    return NextResponse.json({
      success: true,
      products: normalizedProducts,
      stats,
      categories: categories.map((c: any) => ({
        id: String(c.id),
        name: c.name,
      })),
      suppliers: suppliers.map((s: any) => ({
        id: String(s.id),
        name: s.name,
      })),
      units: units.map((u: any) => ({ code: u.code, name: u.name })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        products: [],
        stats: {
          totalProducts: 0,
          lowStockProducts: 0,
          outOfStockProducts: 0,
          totalValue: 0,
          activeProducts: 0,
        },
        categories: [],
        suppliers: [],
        units: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("📝 POST /api/products - Iniciando criação de produto");
    const data = await request.json();
    console.log("📋 Dados recebidos:", data);

    // Verificar se há ID sendo enviado e removê-lo para usar nanoid
    if (data.id) {
      console.log("⚠️ ID fornecido pelo cliente, removendo para usar nanoid");
      delete data.id;
    }

    // Validar dados obrigatórios
    if (!data.name || !data.salePrice) {
      console.log("❌ Dados obrigatórios ausentes:", {
        name: data.name,
        salePrice: data.salePrice,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Nome e preço de venda são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Validar unidade de medida
    const validUnit = data.unit || "UN";
    console.log("🔍 Verificando unidade de medida:", validUnit);

          const unitExists = await sql`
        SELECT code FROM units WHERE code = ${validUnit}
      `;
    console.log("📦 Unidades encontradas:", unitExists.length);

    if (unitExists.length === 0) {
      console.log("❌ Unidade de medida inválida:", validUnit);
      return NextResponse.json(
        {
          success: false,
          error: `Unidade de medida '${validUnit}' não é válida`,
        },
        { status: 400 }
      );
    }

    // Verificar se código já existe
    if (data.codigo) {
      console.log("🔍 Verificando código existente:", data.codigo);
      const existingProduct = await sql`
        SELECT id FROM products WHERE codigo = ${data.codigo}
      `;
      console.log(
        "📦 Produtos com código encontrados:",
        existingProduct.length
      );

      if (existingProduct.length > 0) {
        console.log("❌ Código já existe:", data.codigo);
        return NextResponse.json(
          {
            success: false,
            error: "Código já existe",
          },
          { status: 400 }
        );
      }
    }

    // Verificar se código de barras já existe
    if (data.barcode) {
      console.log("🔍 Verificando código de barras existente:", data.barcode);
      const existingBarcode = await sql`
        SELECT id FROM products WHERE barcode = ${data.barcode}
      `;
      console.log(
        "📦 Produtos com código de barras encontrados:",
        existingBarcode.length
      );

      if (existingBarcode.length > 0) {
        console.log("❌ Código de barras já existe:", data.barcode);
        return NextResponse.json(
          {
            success: false,
            error: "Código de barras já existe",
          },
          { status: 400 }
        );
      }
    }

          // Verificar e obter categoria padrão se não fornecida
      let categoryId = data.categoryId;
      if (!categoryId) {
        console.log("🏷️ Categoria não fornecida, buscando categoria padrão...");
        const defaultCategory = await sql`
          SELECT id FROM categories ORDER BY name LIMIT 1
        `;
        if (defaultCategory.length > 0) {
          categoryId = defaultCategory[0].id;
          console.log("✅ Categoria padrão encontrada:", categoryId);
        } else {
          console.log("❌ Nenhuma categoria encontrada");
          return NextResponse.json(
            {
              success: false,
              error:
                "Nenhuma categoria encontrada. Crie uma categoria primeiro.",
            },
            { status: 400 }
          );
        }
      } else {
        console.log("🏷️ Categoria fornecida:", categoryId);
      }

          // Verificar e obter fornecedor padrão se não fornecido
      let supplierId = data.supplierId;
      if (!supplierId) {
        console.log("🏢 Fornecedor não fornecido, buscando fornecedor padrão...");
        const defaultSupplier = await sql`
          SELECT id FROM suppliers ORDER BY name LIMIT 1
        `;
        if (defaultSupplier.length > 0) {
          supplierId = defaultSupplier[0].id;
          console.log("✅ Fornecedor padrão encontrado:", supplierId);
        } else {
          console.log("❌ Nenhum fornecedor encontrado");
          return NextResponse.json(
            {
              success: false,
              error:
                "Nenhum fornecedor encontrado. Crie um fornecedor primeiro.",
            },
            { status: 400 }
          );
        }
      } else {
        console.log("🏢 Fornecedor fornecido:", supplierId);
      }

    // Gerar código automático se não fornecido
    let codigo = data.codigo;
    if (!codigo) {
      console.log("🔢 Gerando código automático...");
      const lastProduct = await sql`
        SELECT codigo FROM products 
        WHERE codigo ~ '^[0-9]+$' 
        ORDER BY CAST(codigo AS INTEGER) DESC 
        LIMIT 1
      `;
      const lastNumber =
        lastProduct.length > 0 ? Number.parseInt(lastProduct[0].codigo) : 0;
      codigo = String(lastNumber + 1).padStart(6, "0");
      console.log("🔢 Código gerado:", codigo);
    } else {
      console.log("🔢 Código fornecido:", codigo);
    }

    // Gerar ID único para o produto
    const productId = nanoid();
    console.log("🆔 ID gerado para produto:", productId);

    // Preparar dados para inserção
    const insertData = {
      id: productId,
      codigo: codigo,
      name: data.name,
      barcode: data.barcode || null,
      description: data.description || "",
      category_id: categoryId,
      supplier_id: supplierId,
      stock_quantity: data.stockQuantity || 0,
      min_stock: data.minStock || 5,
      max_stock: data.maxStock || 100,
      cost_price: data.costPrice || 0,
      sale_price: data.salePrice,
      unit: validUnit,
      is_active: data.isActive !== false,
      status: "NORMAL",
    };

    console.log("📋 Dados para inserção:", insertData);

    // Inserir produto
    console.log("💾 Executando INSERT...");
    const result = await sql`
      INSERT INTO products (
        id, codigo, name, barcode, description, category_id, supplier_id,
        stock_quantity, min_stock, max_stock, cost_price, sale_price,
        unit, "is_active", status, created_at, updated_at
      ) VALUES (
        ${insertData.id}, ${insertData.codigo}, ${insertData.name}, ${insertData.barcode}, ${insertData.description},
        ${insertData.category_id}, ${insertData.supplier_id},
        ${insertData.stock_quantity}, ${insertData.min_stock}, ${insertData.max_stock},
        ${insertData.cost_price}, ${insertData.sale_price}, ${insertData.unit},
        ${insertData.is_active}, ${insertData.status}, NOW(), NOW()
      ) RETURNING *
    `;
    console.log("✅ INSERT executado com sucesso");

    const newProduct = result[0];
    console.log("✅ Produto criado:", newProduct);

    const responseProduct = {
      ...newProduct,
      id: String(newProduct.id),
      categoryId: newProduct.category_id
        ? String(newProduct.category_id)
        : null,
      supplierId: newProduct.supplier_id
        ? String(newProduct.supplier_id)
        : null,
      stockQuantity: Number(newProduct.stock_quantity),
      minStock: Number(newProduct.min_stock),
      maxStock: Number(newProduct.max_stock),
      costPrice: Number(newProduct.cost_price),
      salePrice: Number(newProduct.sale_price),
      isActive: Boolean(newProduct.is_active),
      unit: newProduct.unit,
    };

    console.log("📤 Retornando resposta com produto:", responseProduct);

    return NextResponse.json({
      success: true,
      product: responseProduct,
      message: "Produto criado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error);
    console.error(
      "📄 Stack trace:",
      error instanceof Error ? error.stack : "Sem stack trace"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
