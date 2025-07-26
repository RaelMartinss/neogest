// Script para testar a criação de produtos com nanoid
const fetch = require('node-fetch');

async function testCreateProduct() {
  console.log('🧪 Testando criação de produto com nanoid...\n');

  try {
    // Testar criação de produto sem ID (deve gerar automaticamente)
    console.log('📝 Testando criação de produto sem ID...');
    const newProduct = {
      name: 'Produto Teste Nanoid',
      codigo: 'TEST001',
      barcode: '7891234567890',
      description: 'Produto de teste criado com nanoid',
      salePrice: 25.90,
      costPrice: 15.50,
      stockQuantity: 50,
      minStock: 10,
      maxStock: 100,
      unit: 'UN',
      isActive: true
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
        isActive: data.product.isActive
      });
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao criar produto:', errorData.error);
      console.log('📄 Detalhes:', errorData);
    }

    // Testar criação de produto com ID (deve ser removido)
    console.log('\n📝 Testando criação de produto com ID (deve ser removido)...');
    const productWithId = {
      id: 'test-product-id-123',
      name: 'Produto Teste Com ID',
      codigo: 'TEST002',
      barcode: '7891234567891',
      description: 'Produto de teste com ID fornecido',
      salePrice: 35.90,
      costPrice: 20.50,
      stockQuantity: 30,
      minStock: 5,
      maxStock: 80,
      unit: 'UN',
      isActive: true
    };

    const response2 = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productWithId)
    });

    console.log('📊 Status da resposta:', response2.status);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Produto criado com sucesso!');
      console.log('🆔 ID gerado (diferente do enviado):', data2.product.id);
      console.log('📋 Dados do produto:', {
        name: data2.product.name,
        codigo: data2.product.codigo,
        barcode: data2.product.barcode,
        salePrice: data2.product.salePrice
      });
    } else {
      const errorData2 = await response2.json();
      console.log('❌ Erro ao criar produto:', errorData2.error);
    }

    // Testar validação de dados obrigatórios
    console.log('\n🚫 Testando validação de dados obrigatórios...');
    const invalidProduct = {
      name: 'Produto Sem Preço',
      codigo: 'TEST003'
      // Sem salePrice (obrigatório)
    };

    const response3 = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidProduct)
    });

    if (!response3.ok) {
      const errorData3 = await response3.json();
      console.log('✅ Validação funcionando! Erro:', errorData3.error);
    } else {
      console.log('⚠️ Validação não funcionou como esperado');
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
testCreateProduct(); 