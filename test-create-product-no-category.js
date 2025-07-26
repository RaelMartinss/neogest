// Script para testar a criação de produtos sem categoria e fornecedor específicos
const fetch = require('node-fetch');

async function testCreateProductNoCategory() {
  console.log('🧪 Testando criação de produto sem categoria/fornecedor específicos...\n');

  try {
    // Testar criação de produto sem categoria e fornecedor (deve usar padrões)
    console.log('📝 Testando criação de produto sem categoria/fornecedor...');
    const newProduct = {
      name: 'Produto Teste Sem Categoria',
      codigo: 'TEST001',
      barcode: '7891234567890',
      description: 'Produto de teste sem categoria e fornecedor específicos',
      salePrice: 25.90,
      costPrice: 15.50,
      stockQuantity: 50,
      minStock: 10,
      maxStock: 100,
      unit: 'UN',
      isActive: true
      // Sem categoryId e supplierId - deve usar padrões
    };

    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Produto criado com sucesso!');
      console.log('🆔 ID gerado:', data.product.id);
      console.log('📋 Dados do produto:', {
        name: data.product.name,
        codigo: data.product.codigo,
        barcode: data.product.barcode,
        salePrice: data.product.salePrice,
        stockQuantity: data.product.stockQuantity,
        isActive: data.product.isActive,
        categoryId: data.product.categoryId,
        supplierId: data.product.supplierId
      });
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao criar produto:', errorData.error);
      console.log('📄 Detalhes:', errorData.details);
    }

    // Testar criação de produto com categoria e fornecedor específicos
    console.log('\n📝 Testando criação de produto com categoria/fornecedor...');
    const productWithCategory = {
      name: 'Produto Teste Com Categoria',
      codigo: 'TEST002',
      barcode: '7891234567891',
      description: 'Produto de teste com categoria e fornecedor específicos',
      salePrice: 35.90,
      costPrice: 20.50,
      stockQuantity: 30,
      minStock: 5,
      maxStock: 80,
      unit: 'UN',
      isActive: true,
      categoryId: 'cat-001', // Usando ID da categoria "Geral"
      supplierId: 'sup-001'  // Usando ID do fornecedor "Fornecedor Geral"
    };

    const response2 = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productWithCategory)
    });

    console.log('📊 Status da resposta:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Produto criado com sucesso!');
      console.log('🆔 ID gerado:', data2.product.id);
      console.log('📋 Dados do produto:', {
        name: data2.product.name,
        codigo: data2.product.codigo,
        categoryId: data2.product.categoryId,
        supplierId: data2.product.supplierId
      });
    } else {
      const errorData2 = await response2.json();
      console.log('❌ Erro ao criar produto:', errorData2.error);
      console.log('📄 Detalhes:', errorData2.details);
    }

    // Testar busca de produtos para verificar se foram criados
    console.log('\n📋 Testando busca de produtos...');
    const getAllResponse = await fetch('http://localhost:3000/api/products');
    
    if (getAllResponse.ok) {
      const allProducts = await getAllResponse.json();
      console.log(`✅ Encontrados ${allProducts.products?.length || 0} produtos`);
      
      if (allProducts.products && allProducts.products.length > 0) {
        const testProducts = allProducts.products.filter(p => p.name.includes('Teste'));
        console.log(`📦 Produtos de teste encontrados: ${testProducts.length}`);
        testProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (ID: ${product.id}, Código: ${product.codigo})`);
          console.log(`     Categoria: ${product.categoryId}, Fornecedor: ${product.supplierId}`);
          console.log(`     Preço: R$ ${product.salePrice}, Estoque: ${product.stockQuantity}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar produtos:', getAllResponse.status);
    }

  } catch (error) {
    console.error('💥 Erro ao testar criação de produto:', error.message);
  }
}

// Executar o teste
testCreateProductNoCategory(); 