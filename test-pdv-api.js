// Script de teste para a API de produtos direta do PDV
const fetch = require('node-fetch');

async function testPDVAPI() {
  console.log('🧪 Testando API de produtos direta para PDV...\n');

  try {
    // Testar a API de produtos direta
    const response = await fetch('http://localhost:3000/api/products/direct');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API funcionando corretamente!');
      console.log('📦 Dados recebidos:', {
        success: data.success,
        totalProducts: data.products?.length || 0
      });
      
      if (data.products && data.products.length > 0) {
        console.log('\n🏷️ Primeiros 5 produtos:');
        data.products.slice(0, 5).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
          console.log(`     Código: "${product.codigo}" | Barras: "${product.barcode}"`);
          console.log(`     Preço: R$ ${product.salePrice} | Estoque: ${product.stockQuantity}`);
          console.log('');
        });
        
        // Testar busca por código de barras
        console.log('🔍 Testando busca por códigos de barras...');
        const testCodes = data.products.slice(0, 3).map(p => p.barcode).filter(b => b);
        
        testCodes.forEach(code => {
          const found = data.products.find(p => p.barcode === code || p.codigo === code);
          console.log(`  Código "${code}": ${found ? '✅ Encontrado' : '❌ Não encontrado'}`);
        });
      } else {
        console.log('⚠️ Nenhum produto encontrado. Verifique se há produtos cadastrados.');
      }
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Resposta de erro:', errorText);
    }
  } catch (error) {
    console.error('💥 Erro ao testar API:', error.message);
  }
}

// Executar o teste
testPDVAPI(); 