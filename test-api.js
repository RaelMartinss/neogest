const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 Testando API de produtos...');
    
    // Teste 1: Buscar todos os produtos
    const response1 = await fetch('http://localhost:3000/api/products');
    const data1 = await response1.json();
    console.log('📦 Total de produtos:', data1.products?.length || 0);
    console.log('🏷️ Categorias disponíveis:', data1.categories?.map(c => `${c.name} (${c.id})`));
    
    // Teste 2: Filtrar por categoria Bebidas
    const bebidasCategory = data1.categories?.find(c => c.name === 'Bebidas');
    if (bebidasCategory) {
      console.log('🥤 ID da categoria Bebidas:', bebidasCategory.id);
      
      const response2 = await fetch(`http://localhost:3000/api/products?category=${bebidasCategory.id}`);
      const data2 = await response2.json();
      console.log('🥤 Produtos de Bebidas encontrados:', data2.products?.length || 0);
      
      if (data2.products?.length > 0) {
        console.log('🥤 Produtos de Bebidas:', data2.products.map(p => ({
          name: p.name,
          categoryId: p.categoryId,
          categoryName: p.categoryName
        })));
      }
    } else {
      console.log('❌ Categoria Bebidas não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAPI(); 