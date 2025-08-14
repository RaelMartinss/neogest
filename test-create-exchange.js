// Script para testar criação de solicitação de troca
const fetch = require('node-fetch');

async function testCreateExchange() {
  console.log('🧪 Testando criação de solicitação de troca...');

  const payload = {
    type: "TROCA",
    originalSaleNumber: "V-2024-001",
    customerName: "Cliente Teste",
    customerDocument: "123.456.789-00",
    userId: 1,
    userName: "Usuário Teste",
    reasonId: 1,
    reasonDescription: "Produto com defeito",
    notes: "Teste automatizado",
    items: [
      {
        productId: 1,
        productName: "Produto Teste",
        productCode: "P001",
        quantity: 1,
        unitPrice: 10.0,
        newProductId: 2,
        newProductName: "Produto Novo",
        newQuantity: 1,
        newUnitPrice: 10.0
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/exchanges-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', data);
  } catch (error) {
    console.error('Erro ao testar criação:', error);
  }
}

testCreateExchange(); 