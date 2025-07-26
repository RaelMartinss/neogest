// Script para testar a atualização de produtos
const fetch = require('node-fetch');

async function testUpdateProduct() {
  console.log('🧪 Testando atualização de produto...\n');

  try {
    // Primeiro, criar um produto para testar a atualização
    console.log('📝 Criando produto para teste...');
    const newProduct = {
      name: 'Produto Para Atualizar',
      codigo: 'UPDATE001',
      barcode: '7891234567890',
      description: 'Produto criado para testar atualização',
      salePrice: 25.90,
      costPrice: 15.50,
      stockQuantity: 50,
      minStock: 10,
      maxStock: 100,
      unit: 'UN',
      isActive: true
    };

    const createResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.log('❌ Erro ao criar produto:', errorData.error);
      return;
    }

    const createdData = await createResponse.json();
    const productId = createdData.product.id;
    console.log('✅ Produto criado com ID:', productId);

    // Agora testar a atualização
    console.log('\n📝 Testando atualização do produto...');
    const updateData = {
      name: 'Produto Atualizado',
      codigo: 'UPDATE002',
      barcode: '7891234567891',
      description: 'Produto atualizado com sucesso',
      salePrice: 35.90,
      costPrice: 20.50,
      stockQuantity: 75,
      minStock: 15,
      maxStock: 150,
      unit: 'UN',
      isActive: true
    };

    const updateResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    console.log('📊 Status da resposta:', updateResponse.status);
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Produto atualizado com sucesso!');
      console.log('🆔 ID do produto:', updateResult.product.id);
      console.log('📋 Dados atualizados:', {
        name: updateResult.product.name,
        codigo: updateResult.product.codigo,
        barcode: updateResult.product.barcode,
        salePrice: updateResult.product.salePrice,
        stockQuantity: updateResult.product.stockQuantity,
        isActive: updateResult.product.isActive
      });
    } else {
      const errorData = await updateResponse.json();
      console.log('❌ Erro ao atualizar produto:', errorData.error);
      console.log('📄 Detalhes:', errorData.details);
    }

    // Testar busca do produto atualizado
    console.log('\n📋 Testando busca do produto atualizado...');
    const getResponse = await fetch(`http://localhost:3000/api/products/${productId}`);
    
    if (getResponse.ok) {
      const productData = await getResponse.json();
      console.log('✅ Produto encontrado após atualização:');
      console.log('📋 Dados do produto:', {
        name: productData.product.name,
        codigo: productData.product.codigo,
        barcode: productData.product.barcode,
        salePrice: productData.product.salePrice,
        stockQuantity: productData.product.stockQuantity
      });
    } else {
      console.log('❌ Erro ao buscar produto:', getResponse.status);
    }

    // Testar atualização com dados inválidos
    console.log('\n🚫 Testando atualização com dados inválidos...');
    const invalidUpdateData = {
      name: 'Produto Sem Preço',
      // Sem salePrice (obrigatório)
    };

    const invalidUpdateResponse = await fetch(`http://localhost:3000/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidUpdateData)
    });

    if (!invalidUpdateResponse.ok) {
      const invalidErrorData = await invalidUpdateResponse.json();
      console.log('✅ Validação funcionando! Erro:', invalidErrorData.error);
    } else {
      console.log('⚠️ Validação não funcionou como esperado');
    }

    // Testar atualização de produto inexistente
    console.log('\n🚫 Testando atualização de produto inexistente...');
    const nonExistentId = 'produto-inexistente-123';
    const nonExistentResponse = await fetch(`http://localhost:3000/api/products/${nonExistentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!nonExistentResponse.ok) {
      const nonExistentErrorData = await nonExistentResponse.json();
      console.log('✅ Produto inexistente tratado corretamente! Erro:', nonExistentErrorData.error);
    } else {
      console.log('⚠️ Produto inexistente não foi tratado corretamente');
    }

  } catch (error) {
    console.error('💥 Erro ao testar atualização de produto:', error.message);
  }
}

// Executar o teste
testUpdateProduct(); 