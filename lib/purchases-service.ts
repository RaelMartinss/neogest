import { neon } from "@neondatabase/serverless";
import { console } from "inspector";

const sql = neon(process.env.DATABASE_URL!);

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj?: string;
  cpf?: string;
  razao_social?: string;
  nome_fantasia?: string;
  contato?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  status: "ativo" | "inativo" | "bloqueado";
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoCompra {
  id: number;
  numero: string;
  fornecedor_id: number;
  fornecedor_nome?: string;
  data_pedido: string;
  data_previsao_entrega?: string;
  data_entrega?: string;
  valor_total: number;
  desconto: number;
  valor_frete: number;
  valor_final: number;
  status:
    | "pendente"
    | "aprovado"
    | "enviado"
    | "entregue"
    | "cancelado"
    | "parcial";
  observacoes?: string;
  usuario_id?: number;
  itens_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ItemPedidoCompra {
  id: number;
  pedido_compra_id: number;
  produto_id?: number;
  codigo_produto?: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  valor_total: number;
  quantidade_recebida: number;
  created_at: string;
}

export interface Entrega {
  id: number;
  pedido_compra_id: number;
  numero_entrega?: string;
  data_entrega: string;
  data_prevista?: string;
  status: "pendente" | "em_transito" | "entregue" | "atrasado" | "cancelado";
  transportadora?: string;
  codigo_rastreamento?: string;
  observacoes?: string;
  usuario_recebimento?: number;
  pedido_numero?: string;
  fornecedor_nome?: string;
  created_at: string;
  updated_at: string;
}

// Fornecedores
export async function getFornecedores(search?: string, status?: string) {
  try {
    if (!search && !status) {
      const result = await sql`
      SELECT * FROM fornecedores ORDER BY nome ASC
    `;
      return result as Fornecedor[];
    }

    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      const result = await sql`
        SELECT * 
        FROM fornecedores
        WHERE nome ILIKE ${"%" + search + "%"}
          OR cnpj ILIKE ${"%" + search + "%"}
          OR email ILIKE ${"%" + search + "%"}
        ORDER BY nome ASC
      `;

      return result as Fornecedor[];
    }

    if (status) {
      console.log("Status filter:", status);
      const result =
        await sql` SELECT * FROM fornecedores WHERE status = ${status}`;

      return result as Fornecedor[];
    }
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw error;
  }
}

export async function getFornecedorById(id: number) {
  try {
    const result = await sql`
      SELECT * FROM fornecedores WHERE id = ${id}
    `;
    return result[0] as Fornecedor | null;
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    throw error;
  }
}

export async function createFornecedor(
  data: Omit<Fornecedor, "id" | "created_at" | "updated_at">
) {
  try {
    const result = await sql`
      INSERT INTO fornecedores (
        nome, cnpj, cpf, razao_social, nome_fantasia, contato, email, 
        telefone, celular, endereco, cep, cidade, estado, pais, status, observacoes
      ) VALUES (
        ${data.nome}, ${data.cnpj || null}, ${data.cpf || null}, ${
      data.razao_social || null
    }, 
        ${data.nome_fantasia || null}, ${data.contato || null}, ${
      data.email || null
    },
        ${data.telefone || null}, ${data.celular || null}, ${
      data.endereco || null
    }, 
        ${data.cep || null}, ${data.cidade || null}, ${data.estado || null}, 
        ${data.pais || "Brasil"}, ${data.status}, ${data.observacoes || null}
      ) RETURNING *
    `;
    return result[0] as Fornecedor;
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw error;
  }
}

export async function updateFornecedor(id: number, data: Partial<Fornecedor>) {
  try {
    const result = await sql`
      UPDATE fornecedores SET
        nome = COALESCE(${data.nome}, nome),
        cnpj = COALESCE(${data.cnpj}, cnpj),
        cpf = COALESCE(${data.cpf}, cpf),
        razao_social = COALESCE(${data.razao_social}, razao_social),
        nome_fantasia = COALESCE(${data.nome_fantasia}, nome_fantasia),
        contato = COALESCE(${data.contato}, contato),
        email = COALESCE(${data.email}, email),
        telefone = COALESCE(${data.telefone}, telefone),
        celular = COALESCE(${data.celular}, celular),
        endereco = COALESCE(${data.endereco}, endereco),
        cep = COALESCE(${data.cep}, cep),
        cidade = COALESCE(${data.cidade}, cidade),
        estado = COALESCE(${data.estado}, estado),
        pais = COALESCE(${data.pais}, pais),
        status = COALESCE(${data.status}, status),
        observacoes = COALESCE(${data.observacoes}, observacoes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as Fornecedor;
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    throw error;
  }
}

// Pedidos de Compra
export async function getPedidosCompra(
  search?: string,
  status?: string,
  fornecedor_id?: number
) {
  try {
    console.log("Filters - search:", search, "status:", status, "fornecedor_id:", fornecedor_id);
    if (!search && !status && !fornecedor_id) {
      const result = await sql`
      SELECT 
        pc.*,
        f.nome as fornecedor_nome,
        COUNT(ipc.id) as itens_count
      FROM pedidos_compra pc
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      LEFT JOIN itens_pedido_compra ipc ON pc.id = ipc.pedido_compra_id
      GROUP BY pc.id, f.nome
      ORDER BY pc.data_pedido DESC
    `;
      return result as PedidoCompra[];
    }
    
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
     const result = await sql` 
       SELECT 
        pc.*,
        f.nome as fornecedor_nome,
        COUNT(ipc.id) as itens_count
      FROM pedidos_compra pc
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      LEFT JOIN itens_pedido_compra ipc ON pc.id = ipc.pedido_compra_id
      AND (pc.numero ILIKE ${paramIndex} OR f.nome ILIKE ${paramIndex})
      GROUP BY pc.id, f.nome ORDER BY pc.data_pedido DESC`;
      params.push(`%${search}%`);
      paramIndex++;

      return result as PedidoCompra[];
    }

    if (status) {
      console.log("Status filter:", status);
      const result = await sql`SELECT 
        pc.*,
        f.nome as fornecedor_nome,
        COUNT(ipc.id) as itens_count
      FROM pedidos_compra pc
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      LEFT JOIN itens_pedido_compra ipc ON pc.id = ipc.pedido_compra_id
       AND pc.status = ${status}
       GROUP BY pc.id, f.nome ORDER BY pc.data_pedido DESC`;
      // params.push(status);
      // paramIndex++;
      console.log("Status filter:", status);
      console.log("Params:", params);
      console.log("ParamIndex:", paramIndex);
      return result as PedidoCompra[];
    }

    if (fornecedor_id) {
      const result = await sql`SELECT 
        pc.*,
        f.nome as fornecedor_nome,
        COUNT(ipc.id) as itens_count
      FROM pedidos_compra pc
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      LEFT JOIN itens_pedido_compra ipc ON pc.id = ipc.pedido_compra_id
       AND pc.fornecedor_id = ${paramIndex}
       GROUP BY pc.id, f.nome ORDER BY pc.data_pedido DESC`;
      params.push(fornecedor_id);
      paramIndex++;

      return result as PedidoCompra[];
    }

  } catch (error) {
    console.error("Erro ao buscar pedidos de compra:", error);
    throw error;
  }
}

export async function getPedidoCompraById(id: number) {
  try {
    const pedido = await sql`
      SELECT 
        pc.*,
        f.nome as fornecedor_nome
      FROM pedidos_compra pc
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      WHERE pc.id = ${id}
    `;

    if (!pedido[0]) return null;

    const itens = await sql`
      SELECT * FROM itens_pedido_compra 
      WHERE pedido_compra_id = ${id}
      ORDER BY id ASC
    `;

    return {
      ...pedido[0],
      itens: itens as ItemPedidoCompra[],
    };
  } catch (error) {
    console.error("Erro ao buscar pedido de compra:", error);
    throw error;
  }
}

export async function createPedidoCompra(data: {
  fornecedor_id: number;
  data_previsao_entrega?: string;
  observacoes?: string;
  itens: Array<{
    produto_id?: number;
    codigo_produto?: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    desconto?: number;
  }>;
}) {
  try {
    // Gerar número do pedido
    const lastPedido = await sql`
      SELECT numero FROM pedidos_compra 
      ORDER BY id DESC LIMIT 1
    `;

    let nextNumber = 1;
    if (lastPedido[0]) {
      const match = lastPedido[0].numero.match(/PC-\d{4}-(\d+)/);
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1;
      }
    }

    const numero = `PC-${new Date().getFullYear()}-${nextNumber
      .toString()
      .padStart(3, "0")}`;

    // Calcular valor total
    const valorTotal = data.itens.reduce((total, item) => {
      const valorItem =
        item.quantidade * item.preco_unitario - (item.desconto || 0);
      return total + valorItem;
    }, 0);

    // Criar pedido
    const pedido = await sql`
      INSERT INTO pedidos_compra (
        numero, fornecedor_id, data_previsao_entrega, valor_total, valor_final, observacoes
      ) VALUES (
        ${numero}, ${data.fornecedor_id}, ${
      data.data_previsao_entrega || null
    }, 
        ${valorTotal}, ${valorTotal}, ${data.observacoes || null}
      ) RETURNING *
    `;

    // Criar itens
    for (const item of data.itens) {
      const valorItem =
        item.quantidade * item.preco_unitario - (item.desconto || 0);
      await sql`
        INSERT INTO itens_pedido_compra (
          pedido_compra_id, produto_id, codigo_produto, nome_produto, 
          quantidade, preco_unitario, desconto, valor_total
        ) VALUES (
          ${pedido[0].id}, ${item.produto_id || null}, ${
        item.codigo_produto || null
      }, 
          ${item.nome_produto}, ${item.quantidade}, ${item.preco_unitario}, 
          ${item.desconto || 0}, ${valorItem}
        )
      `;
    }

    return pedido[0] as PedidoCompra;
  } catch (error) {
    console.error("Erro ao criar pedido de compra:", error);
    throw error;
  }
}

export async function updatePedidoCompraStatus(id: number, status: string) {
  try {
    const result = await sql`
      UPDATE pedidos_compra 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as PedidoCompra;
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    throw error;
  }
}

// Entregas
export async function getEntregas(search?: string, status?: string) {
  try {
    console.log("Filters - search:", search, "status:", status);
    if (!search && !status) {
      const result = await sql`
        SELECT 
          e.*,
          pc.numero as pedido_numero,
          f.nome as fornecedor_nome
        FROM entregas e
        LEFT JOIN pedidos_compra pc ON e.pedido_compra_id = pc.id
        LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      `;
      return result as Entrega[];
    }
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      console.log("Search filter:", search);
      const result = await sql`  SELECT 
          e.*,
          pc.numero as pedido_numero,
          f.nome as fornecedor_nome
        FROM entregas e
        LEFT JOIN pedidos_compra pc ON e.pedido_compra_id = pc.id
        LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id 
        AND (e.numero_entrega ILIKE ${paramIndex} 
        OR pc.numero ILIKE ${paramIndex} 
        OR f.nome ILIKE ${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;

      return result as Entrega[];
    }

    if (status) {
      console.log("getEntregas Status filter:", status);
      const result = await sql`  SELECT 
          e.*,
          pc.numero as pedido_numero,
          f.nome as fornecedor_nome
        FROM entregas e
        LEFT JOIN pedidos_compra pc ON e.pedido_compra_id = pc.id
        LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
         AND e.status = ${status}`;
      // params.push(status);
      // paramIndex++;

      return result as Entrega[];
    }

  } catch (error) {
    console.error("Erro ao buscar entregas:", error);
    throw error;
  }
}

export async function getEntregasHoje() {
  try {
    const result = await sql`
      SELECT 
        e.*,
        pc.numero as pedido_numero,
        f.nome as fornecedor_nome
      FROM entregas e
      LEFT JOIN pedidos_compra pc ON e.pedido_compra_id = pc.id
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      WHERE DATE(e.data_entrega) = CURRENT_DATE
      ORDER BY e.data_entrega ASC
    `;
    return result as Entrega[];
  } catch (error) {
    console.error("Erro ao buscar entregas de hoje:", error);
    throw error;
  }
}

export async function getEntregasAtrasadas() {
  try {
    const result = await sql`
      SELECT 
        e.*,
        pc.numero as pedido_numero,
        f.nome as fornecedor_nome
      FROM entregas e
      LEFT JOIN pedidos_compra pc ON e.pedido_compra_id = pc.id
      LEFT JOIN fornecedores f ON pc.fornecedor_id = f.id
      WHERE e.data_prevista < CURRENT_DATE AND e.status != 'entregue'
      ORDER BY e.data_prevista ASC
    `;
    return result as Entrega[];
  } catch (error) {
    console.error("Erro ao buscar entregas atrasadas:", error);
    throw error;
  }
}

// Estatísticas
export async function getPurchasesStats() {
  try {
    const stats = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pedidos_pendentes,
        COUNT(CASE WHEN DATE(data_previsao_entrega) = CURRENT_DATE THEN 1 END) as entregas_hoje,
        COALESCE(SUM(CASE WHEN status != 'cancelado' THEN valor_final ELSE 0 END), 0) as valor_total_compras,
        (SELECT COUNT(*) FROM fornecedores WHERE status = 'ativo') as fornecedores_ativos
      FROM pedidos_compra
      WHERE EXTRACT(MONTH FROM data_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM data_pedido) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    // Converter valores para números para evitar erros de tipo
    const result = stats[0];
    return {
      pedidos_pendentes: Number(result.pedidos_pendentes) || 0,
      entregas_hoje: Number(result.entregas_hoje) || 0,
      valor_total_compras: Number(result.valor_total_compras) || 0,
      fornecedores_ativos: Number(result.fornecedores_ativos) || 0,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de compras:", error);
    throw error;
  }
}
