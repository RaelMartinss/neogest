// Script para testar a criação de clientes com timestamps
const fetch = require('node-fetch');

async function testCustomerTimestamps() {
  console.log('🧪 Testando criação de cliente com timestamps...\n');

  try {
    // Testar criação de cliente
    console.log('📝 Testando criação de cliente...');
    const newCustomer = {
      name: 'Cliente Teste Timestamps',
      email: 'teste@timestamps.com',
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
      console.log('🆔 ID:', data.customer.id);
      console.log('📅 Timestamps:', {
        createdAt: data.customer.createdAt,
        updatedAt: data.customer.updatedAt,
        is_active: data.customer.is_active
      });
      console.log('📋 Dados do cliente:', {
        name: data.customer.name,
        email: data.customer.email,
        cpf_cnpj: data.customer.cpf_cnpj
      });

      // Testar atualização do cliente
      console.log('\n✏️ Testando atualização do cliente...');
      const updateData = {
        name: 'Cliente Teste Timestamps Atualizado',
        phone: '(11) 98765-4321'
      };

      const updateResponse = await fetch(`http://localhost:3000/api/customers/${data.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        console.log('✅ Cliente atualizado com sucesso!');
        console.log('📅 Timestamps após atualização:', {
          createdAt: updatedData.customer.createdAt,
          updatedAt: updatedData.customer.updatedAt
        });
        console.log('📋 Dados atualizados:', {
          name: updatedData.customer.name,
          phone: updatedData.customer.phone
        });
      } else {
        const errorData = await updateResponse.json();
        console.log('❌ Erro ao atualizar cliente:', errorData.error);
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Erro ao criar cliente:', errorData.error);
      console.log('📄 Detalhes:', errorData.details);
    }

    // Testar busca de todos os clientes
    console.log('\n📋 Testando busca de todos os clientes...');
    const getAllResponse = await fetch('http://localhost:3000/api/customers');
    
    if (getAllResponse.ok) {
      const allCustomers = await getAllResponse.json();
      console.log(`✅ Encontrados ${allCustomers.customers?.length || 0} clientes`);
      
      if (allCustomers.customers && allCustomers.customers.length > 0) {
        const firstCustomer = allCustomers.customers[0];
        console.log('📅 Primeiro cliente:', {
          id: firstCustomer.id,
          name: firstCustomer.name,
          createdAt: firstCustomer.createdAt,
          updatedAt: firstCustomer.updatedAt,
          is_active: firstCustomer.is_active
        });
      }
    } else {
      console.log('❌ Erro ao buscar clientes:', getAllResponse.status);
    }

  } catch (error) {
    console.error('💥 Erro ao testar timestamps:', error.message);
  }
}

// Executar o teste
testCustomerTimestamps(); 