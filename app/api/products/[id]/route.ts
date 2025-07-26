import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("📝 PUT /api/products/[id] - Iniciando atualização de produto");
    const data = await request.json();
    console.log("📋 Dados recebidos para atualização:", data);
    console.log("🆔 ID do produto para atualizar:", params.id);

    if (!params.id) {
      console.log("❌ ID do produto não fornecido");
      return NextResponse.json(
        {
          success: false,
          error: "ID do produto é obrigatório",
        },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const existingProduct = await sql`
      SELECT id FROM products WHERE id = ${params.id}
    `;
    
    if (existingProduct.length === 0) {
      console.log("❌ Produto não encontrado:", params.id);
      return NextResponse.json(
        {
          success: false,
          error: "Produto não encontrado",
        },
        { status: 404 }
      );
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

    // Verificar se código já existe em outro produto
    if (data.codigo) {
      console.log("🔍 Verificando código existente:", data.codigo);
      const existingCode = await sql`
        SELECT id FROM products WHERE codigo = ${data.codigo} AND id != ${params.id}
      `;
      console.log("📦 Produtos com código encontrados:", existingCode.length);

      if (existingCode.length > 0) {
        console.log("❌ Código já existe em outro produto:", data.codigo);
        return NextResponse.json(
          {
            success: false,
            error: "Código já existe em outro produto",
          },
          { status: 400 }
        );
      }
    }

    // Verificar se código de barras já existe em outro produto
    if (data.barcode) {
      console.log("🔍 Verificando código de barras existente:", data.barcode);
      const existingBarcode = await sql`
        SELECT id FROM products WHERE barcode = ${data.barcode} AND id != ${params.id}
      `;
      console.log("📦 Produtos com código de barras encontrados:", existingBarcode.length);

      if (existingBarcode.length > 0) {
        console.log("❌ Código de barras já existe em outro produto:", data.barcode);
        return NextResponse.json(
          {
            success: false,
            error: "Código de barras já existe em outro produto",
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
            error: "Nenhuma categoria encontrada. Crie uma categoria primeiro.",
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
            error: "Nenhum fornecedor encontrado. Crie um fornecedor primeiro.",
          },
          { status: 400 }
        );
      }
    } else {
      console.log("🏢 Fornecedor fornecido:", supplierId);
    }

    // Preparar dados para atualização
    const updateData = {
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
      status: data.status || "NORMAL",
    };

    console.log("📋 Dados para atualização:", updateData);

    // Atualizar produto
    console.log("💾 Executando UPDATE...");
    const result = await sql`
      UPDATE products SET
        name = ${updateData.name},
        barcode = ${updateData.barcode},
        description = ${updateData.description},
        category_id = ${updateData.category_id},
        supplier_id = ${updateData.supplier_id},
        stock_quantity = ${updateData.stock_quantity},
        min_stock = ${updateData.min_stock},
        max_stock = ${updateData.max_stock},
        cost_price = ${updateData.cost_price},
        sale_price = ${updateData.sale_price},
        unit = ${updateData.unit},
        "is_active" = ${updateData.is_active},
        status = ${updateData.status},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;
    console.log("✅ UPDATE executado com sucesso");

    const updatedProduct = result[0];
    console.log("✅ Produto atualizado:", updatedProduct);

    const responseProduct = {
      ...updatedProduct,
      id: String(updatedProduct.id),
      categoryId: updatedProduct.category_id
        ? String(updatedProduct.category_id)
        : null,
      supplierId: updatedProduct.supplier_id
        ? String(updatedProduct.supplier_id)
        : null,
      stockQuantity: Number(updatedProduct.stock_quantity),
      minStock: Number(updatedProduct.min_stock),
      maxStock: Number(updatedProduct.max_stock),
      costPrice: Number(updatedProduct.cost_price),
      salePrice: Number(updatedProduct.sale_price),
      isActive: Boolean(updatedProduct.is_active),
      unit: updatedProduct.unit,
    };

    console.log("📤 Retornando resposta com produto atualizado:", responseProduct);

    return NextResponse.json({
      success: true,
      product: responseProduct,
      message: "Produto atualizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar produto:", error);
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("📝 GET /api/products/[id] - Buscando produto:", params.id);

    const product = await sql`
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
      WHERE p.id = ${params.id}
    `;

    if (product.length === 0) {
      console.log("❌ Produto não encontrado:", params.id);
      return NextResponse.json(
        {
          success: false,
          error: "Produto não encontrado",
        },
        { status: 404 }
      );
    }

    const productData = product[0];
    console.log("✅ Produto encontrado:", productData);

    const responseProduct = {
      ...productData,
      id: String(productData.id),
      categoryId: productData.categoryId ? String(productData.categoryId) : null,
      supplierId: productData.supplierId ? String(productData.supplierId) : null,
      stockQuantity: Number(productData.stockQuantity),
      minStock: Number(productData.minStock),
      maxStock: Number(productData.maxStock),
      costPrice: Number(productData.costPrice),
      salePrice: Number(productData.salePrice),
      isActive: Boolean(productData.isActive),
      unit: productData.unit,
    };

    return NextResponse.json({
      success: true,
      product: responseProduct,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar produto:", error);
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