// Script de teste para a API de clientes
const fetch = require('node-fetch');

async function testCustomersAPI() {
  console.log('🧪 Testando API de clientes...\n');

  try {
    // Testar busca de todos os clientes
    console.log('📋 Testando busca de todos os clientes...');
    const response = await fetch('http://localhost:3000/api/customers');
    
    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando corretamente!');
      console.log('👥 Dados recebidos:', {
        totalCustomers: data.customers?.length || 0
      });
      
      if (data.customers && data.customers.length > 0) {
        console.log('\n👤 Primeiros 3 clientes:');
        data.customers.slice(0, 3).forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name}`);
          console.log(`     Email: ${customer.email || 'N/A'}`);
          console.log(`     CPF/CNPJ: ${customer.cpf_cnpj || 'N/A'}`);
          console.log(`     Telefone: ${customer.phone || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Nenhum cliente encontrado.');
      }
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Resposta de erro:', errorText);
    }

    // Testar busca por query
    console.log('\n🔍 Testando busca por query...');
    const searchResponse = await fetch('http://localhost:3000/api/customers?q=João');
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Busca funcionando! Encontrados ${searchData.customers?.length || 0} clientes`);
    } else {
      console.log('❌ Erro na busca:', searchResponse.status);
    }

    // Testar criação de cliente
    console.log('\n📝 Testando criação de cliente...');
    const newCustomer = {
      name: 'Teste Cliente API',
      email: 'teste@api.com',
      cpf_cnpj: '11122233344',
      phone: '(11) 12345-6789',
      city: 'São Paulo',
      state: 'SP'
    };

    const createResponse = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });

    if (createResponse.ok) {
      const createdData = await createResponse.json();
      console.log('✅ Cliente criado com sucesso:', createdData.customer.name);
      
      // Testar atualização do cliente
      console.log('\n✏️ Testando atualização de cliente...');
      const updateData = {
        name: 'Teste Cliente API Atualizado',
        phone: '(11) 98765-4321'
      };

      const updateResponse = await fetch(`http://localhost:3000/api/customers/${createdData.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        console.log('✅ Cliente atualizado com sucesso:', updatedData.customer.name);
      } else {
        console.log('❌ Erro ao atualizar cliente:', updateResponse.status);
      }
    } else {
      const errorData = await createResponse.json();
      console.log('❌ Erro ao criar cliente:', errorData.error);
    }

    // Testar validação de CPF inválido
    console.log('\n🚫 Testando validação de CPF inválido...');
    const invalidCustomer = {
      name: 'Cliente CPF Inválido',
      cpf_cnpj: '12345678900' // CPF inválido
    };

    const invalidResponse = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidCustomer)
    });

    if (!invalidResponse.ok) {
      const invalidData = await invalidResponse.json();
      console.log('✅ Validação funcionando! Erro:', invalidData.error);
    } else {
      console.log('⚠️ Validação não funcionou como esperado');
    }

  } catch (error) {
    console.error('💥 Erro ao testar API:', error.message);
  }
}

// Executar o teste
testCustomersAPI(); 