const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🔍 Testando autenticação...');
    
    // Teste 1: Verificar se está redirecionando para login
    const response1 = await fetch('http://localhost:3000/api/debug/auth-test');
    const data1 = await response1.json();
    console.log('📋 Dados de autenticação:', data1);
    
    // Teste 2: Tentar fazer login
    console.log('🔐 Tentando fazer login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'adminEmpresa@empresa.com',
        password: 'FullErpNeo@2'
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login bem-sucedido:', loginData.user);
      
      // Pegar cookies da resposta
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('🍪 Cookies recebidos:', cookies);
      
      // Teste 3: Verificar autenticação com cookies
      const authResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          cookie: cookies || '',
        },
      });
      
      const authData = await authResponse.json();
      console.log('🔐 Verificação de auth:', authResponse.status, authData);
      
    } else {
      const error = await loginResponse.text();
      console.log('❌ Login falhou:', loginResponse.status, error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAuth(); 