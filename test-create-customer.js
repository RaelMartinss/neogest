// Script para testar a criação de clientes com nanoid
const fetch = require('node-fetch');

async function testCreateCustomer() {
  console.log('🧪 Testando criação de cliente com nanoid...\n');

  try {
    // Testar criação de cliente sem ID (deve gerar automaticamente)
    console.log('📝 Testando criação de cliente sem ID...');
    const newCustomer = {
      name: 'Cliente Teste Nanoid',
      email: 'teste@nanoid.com',
      cpf_cnpj: '11122233344',
      phone: '(11) 12345-6789',
      city: 'São Paulo',
      state: 'SP'
    };

    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cliente criado com sucesso!');
      console.log('🆔 ID gerado:', data.customer.id);
      console.log('📋 Dados do cliente:', {
        name: data.customer.name,
        email: data.customer.email,
        cpf_cnpj: data.customer.cpf_cnpj,
        is_active: data.customer.is_active
      });
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao criar cliente:', errorData.error);
      console.log('📄 Detalhes:', errorData.details);
    }

    // Testar criação de cliente com ID (deve ser removido)
    console.log('\n📝 Testando criação de cliente com ID (deve ser removido)...');
    const customerWithId = {
      id: 'test-id-123',
      name: 'Cliente Teste Com ID',
      email: 'teste2@nanoid.com',
      cpf_cnpj: '22233344455',
      phone: '(11) 98765-4321',
      city: 'Rio de Janeiro',
      state: 'RJ'
    };

    const response2 = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerWithId)
    });

    console.log('📊 Status da resposta:', response2.status);
    
    if (response2.ok) {
      const data2 = await response.json();
      console.log('✅ Cliente criado com sucesso!');
      console.log('🆔 ID gerado (diferente do enviado):', data2.customer.id);
      console.log('📋 Dados do cliente:', {
        name: data2.customer.name,
        email: data2.customer.email,
        cpf_cnpj: data2.customer.cpf_cnpj,
        is_active: data2.customer.is_active
      });
    } else {
      const errorData2 = await response2.json();
      console.log('❌ Erro ao criar cliente:', errorData2.error);
    }

    // Testar validação de CPF inválido
    console.log('\n🚫 Testando validação de CPF inválido...');
    const invalidCustomer = {
      name: 'Cliente CPF Inválido',
      cpf_cnpj: '12345678900' // CPF inválido
    };

    const response3 = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidCustomer)
    });

    if (!response3.ok) {
      const errorData3 = await response3.json();
      console.log('✅ Validação funcionando! Erro:', errorData3.error);
    } else {
      console.log('⚠️ Validação não funcionou como esperado');
    }

  } catch (error) {
    console.error('💥 Erro ao testar criação de cliente:', error.message);
  }
}

// Executar o teste
testCreateCustomer(); 