// Script para testar a paginação de produtos
const fetch = require('node-fetch');

async function testPagination() {
  console.log('🧪 Testando paginação de produtos...\n');

  try {
    // Testar primeira página
    console.log('📄 Testando primeira página...');
    const response1 = await fetch('http://localhost:3000/api/products?page=1&limit=10');
    const data1 = await response1.json();
    
    if (data1.success) {
      console.log('✅ Primeira página carregada com sucesso!');
      console.log(`📦 Produtos na página: ${data1.products.length}`);
      console.log(`📊 Total de produtos: ${data1.pagination.total}`);
      console.log(`📄 Página atual: ${data1.pagination.page}`);
      console.log(`📄 Total de páginas: ${data1.pagination.totalPages}`);
      console.log(`⬅️ Tem página anterior: ${data1.pagination.hasPrevPage}`);
      console.log(`➡️ Tem próxima página: ${data1.pagination.hasNextPage}`);
    } else {
      console.log('❌ Erro ao carregar primeira página:', data1.error);
      return;
    }

    // Testar segunda página (se existir)
    if (data1.pagination.hasNextPage) {
      console.log('\n📄 Testando segunda página...');
      const response2 = await fetch('http://localhost:3000/api/products?page=2&limit=10');
      const data2 = await response2.json();
      
      if (data2.success) {
        console.log('✅ Segunda página carregada com sucesso!');
        console.log(`📦 Produtos na página: ${data2.products.length}`);
        console.log(`📄 Página atual: ${data2.pagination.page}`);
        console.log(`⬅️ Tem página anterior: ${data2.pagination.hasPrevPage}`);
        console.log(`➡️ Tem próxima página: ${data2.pagination.hasNextPage}`);
      } else {
        console.log('❌ Erro ao carregar segunda página:', data2.error);
      }
    } else {
      console.log('\n📄 Não há segunda página disponível');
    }

    // Testar paginação com filtro de busca
    console.log('\n🔍 Testando paginação com filtro de busca...');
    const searchResponse = await fetch('http://localhost:3000/api/products?search=produto&page=1&limit=5');
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Busca paginada funcionando!');
      console.log(`📦 Produtos encontrados: ${searchData.products.length}`);
      console.log(`📊 Total de produtos na busca: ${searchData.pagination.total}`);
      console.log(`📄 Total de páginas na busca: ${searchData.pagination.totalPages}`);
    } else {
      console.log('❌ Erro na busca paginada:', searchData.error);
    }

    // Testar paginação com filtro de status
    console.log('\n🏷️ Testando paginação com filtro de status...');
    const statusResponse = await fetch('http://localhost:3000/api/products?status=active&page=1&limit=3');
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log('✅ Filtro de status paginado funcionando!');
      console.log(`📦 Produtos ativos na página: ${statusData.products.length}`);
      console.log(`📊 Total de produtos ativos: ${statusData.pagination.total}`);
      console.log(`📄 Total de páginas de produtos ativos: ${statusData.pagination.totalPages}`);
    } else {
      console.log('❌ Erro no filtro de status paginado:', statusData.error);
    }

    // Testar limite personalizado
    console.log('\n📏 Testando limite personalizado...');
    const limitResponse = await fetch('http://localhost:3000/api/products?page=1&limit=5');
    const limitData = await limitResponse.json();
    
    if (limitData.success) {
      console.log('✅ Limite personalizado funcionando!');
      console.log(`📦 Produtos na página: ${limitData.products.length}`);
      console.log(`📏 Limite solicitado: 5`);
      console.log(`📊 Total de produtos: ${limitData.pagination.total}`);
    } else {
      console.log('❌ Erro com limite personalizado:', limitData.error);
    }

    // Testar página inexistente
    console.log('\n🚫 Testando página inexistente...');
    const invalidPageResponse = await fetch('http://localhost:3000/api/products?page=999&limit=10');
    const invalidPageData = await invalidPageResponse.json();
    
    if (invalidPageData.success) {
      console.log('✅ Página inexistente tratada corretamente!');
      console.log(`📦 Produtos retornados: ${invalidPageData.products.length}`);
      console.log(`📄 Página atual: ${invalidPageData.pagination.page}`);
    } else {
      console.log('❌ Erro com página inexistente:', invalidPageData.error);
    }

    console.log('\n🎉 Teste de paginação concluído!');

  } catch (error) {
    console.error('💥 Erro ao testar paginação:', error.message);
  }
}

// Executar o teste
testPagination(); 