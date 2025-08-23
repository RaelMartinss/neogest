import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface ContaFinanceira {
  id: number
  descricao: string
  tipo: "receber" | "pagar"
  categoria_id?: number
  categoria_nome?: string
  subcategoria?: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: "pendente" | "pago" | "vencido" | "cancelado"
  cliente_id?: number
  cliente_nome?: string
  fornecedor_nome?: string
  observacoes?: string
  recorrente: boolean
  centro_custo_id?: number
  centro_custo_nome?: string
  numero_documento?: string
  forma_pagamento?: string
  juros?: number
  multa?: number
  desconto?: number
  valor_pago?: number
  user_id: number
  created_at: string
  updated_at: string
}

export interface CategoriaFinanceira {
  id: number
  nome: string
  tipo: "receber" | "pagar"
  cor: string
  orcamento?: number
  ativo: boolean
}

export interface MetaFinanceira {
  id: number
  titulo: string
  tipo: "receita" | "despesa" | "economia"
  valor_meta: number
  valor_atual: number
  prazo: string
  status: "atingida" | "em_andamento" | "atrasada"
  user_id: number
}

export interface IndicadorFinanceiro {
  titulo: string
  valor: string
  variacao: number
  tipo: "positivo" | "negativo" | "neutro"
  subtitulo?: string
}

export interface ResumoFinanceiro {
  total_receber: number
  total_pagar: number
  total_recebido: number
  total_pago: number
  saldo_liquido: number
  contas_vencidas: number
  contas_vencendo_hoje: number
  contas_pendentes: number
}

export class FinancialService {
  // Buscar todas as contas com filtros
  static async getContas(filters: {
    tipo?: string
    categoria?: string
    status?: string
    periodo?: string
    search?: string
    user_id: number
  }) {
    try {
      let whereClause = "WHERE cf.user_id = $1"
      const params: any[] = [filters.user_id]

      if (filters.tipo && filters.tipo !== "todos") {
        whereClause += ` AND cf.tipo = $${params.length + 1}`
        params.push(filters.tipo)
      }

      if (filters.status && filters.status !== "todos") {
        whereClause += ` AND cf.status = $${params.length + 1}`
        params.push(filters.status)
      }

      if (filters.categoria && filters.categoria !== "todas") {
        whereClause += ` AND cat.nome = $${params.length + 1}`
        params.push(filters.categoria)
      }

      if (filters.search) {
        whereClause += ` AND (cf.descricao ILIKE $${params.length + 1} OR cf.cliente_nome ILIKE $${params.length + 1} OR cf.fornecedor_nome ILIKE $${params.length + 1})`
        params.push(`%${filters.search}%`)
      }

      // Filtro de período
      if (filters.periodo) {
        const hoje = new Date()
        let dataInicio: Date

        switch (filters.periodo) {
          case "hoje":
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
            whereClause += ` AND cf.data_vencimento = $${params.length + 1}`
            params.push(dataInicio.toISOString().split("T")[0])
            break
          case "semana":
            dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
            whereClause += ` AND cf.data_vencimento >= $${params.length + 1}`
            params.push(dataInicio.toISOString().split("T")[0])
            break
          case "mes":
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            whereClause += ` AND cf.data_vencimento >= $${params.length + 1}`
            params.push(dataInicio.toISOString().split("T")[0])
            break
        }
      }

      const query = `
        SELECT 
          cf.*,
          cat.nome as categoria_nome,
          cc.nome as centro_custo_nome
        FROM contas_financeiras cf
        LEFT JOIN categorias_financeiras cat ON cf.categoria_id = cat.id
        LEFT JOIN centros_custo cc ON cf.centro_custo_id = cc.id
        ${whereClause}
        ORDER BY cf.data_vencimento ASC, cf.created_at DESC
      `

      const result = await sql(query, params)
      return { success: true, data: result }
    } catch (error) {
      console.error("Erro ao buscar contas:", error)
      return { success: false, error: "Erro ao buscar contas financeiras" }
    }
  }

  // Criar nova conta
  static async createConta(conta: Omit<ContaFinanceira, "id" | "created_at" | "updated_at">) {
    try {
      const result = await sql`
        INSERT INTO contas_financeiras (
          descricao, tipo, categoria_id, subcategoria, valor, data_vencimento,
          cliente_id, cliente_nome, fornecedor_nome, observacoes, recorrente,
          centro_custo_id, numero_documento, forma_pagamento, user_id
        ) VALUES (
          ${conta.descricao}, ${conta.tipo}, ${conta.categoria_id}, ${conta.subcategoria},
          ${conta.valor}, ${conta.data_vencimento}, ${conta.cliente_id}, ${conta.cliente_nome},
          ${conta.fornecedor_nome}, ${conta.observacoes}, ${conta.recorrente},
          ${conta.centro_custo_id}, ${conta.numero_documento}, ${conta.forma_pagamento},
          ${conta.user_id}
        )
        RETURNING *
      `

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Erro ao criar conta:", error)
      return { success: false, error: "Erro ao criar conta financeira" }
    }
  }

  // Atualizar conta
  static async updateConta(id: number, updates: Partial<ContaFinanceira>) {
    try {
      const setClauses = []
      const params = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== "id") {
          setClauses.push(`${key} = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }
      }

      if (setClauses.length === 0) {
        return { success: false, error: "Nenhum campo para atualizar" }
      }

      const query = `
        UPDATE contas_financeiras 
        SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `
      params.push(id)

      const result = await sql(query, params)
      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Erro ao atualizar conta:", error)
      return { success: false, error: "Erro ao atualizar conta financeira" }
    }
  }

  // Marcar conta como paga
  static async marcarComoPago(id: number, valorPago?: number, dataPagamento?: string) {
    try {
      const result = await sql`
        UPDATE contas_financeiras
        SET 
          status = 'pago',
          data_pagamento = ${dataPagamento || new Date().toISOString().split("T")[0]},
          valor_pago = ${valorPago || sql`valor`},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error)
      return { success: false, error: "Erro ao marcar conta como paga" }
    }
  }

  // Buscar categorias
  static async getCategorias(tipo?: string) {
    try {
      let query = "SELECT * FROM categorias_financeiras WHERE ativo = true"
      const params = []

      if (tipo) {
        query += " AND tipo = $1"
        params.push(tipo)
      }

      query += " ORDER BY nome"

      const result = await sql(query, params)
      return { success: true, data: result }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      return { success: false, error: "Erro ao buscar categorias" }
    }
  }

  // Buscar centros de custo
  static async getCentrosCusto() {
    try {
      const result = await sql`
        SELECT * FROM centros_custo 
        WHERE ativo = true 
        ORDER BY nome
      `
      return { success: true, data: result }
    } catch (error) {
      console.error("Erro ao buscar centros de custo:", error)
      return { success: false, error: "Erro ao buscar centros de custo" }
    }
  }

  // Buscar resumo financeiro
  static async getResumoFinanceiro(
    userId: number,
  ): Promise<{ success: boolean; data?: ResumoFinanceiro; error?: string }> {
    try {
      const result = await sql`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'receber' AND status != 'cancelado' THEN valor ELSE 0 END), 0) as total_receber,
          COALESCE(SUM(CASE WHEN tipo = 'pagar' AND status != 'cancelado' THEN valor ELSE 0 END), 0) as total_pagar,
          COALESCE(SUM(CASE WHEN tipo = 'receber' AND status = 'pago' THEN COALESCE(valor_pago, valor) ELSE 0 END), 0) as total_recebido,
          COALESCE(SUM(CASE WHEN tipo = 'pagar' AND status = 'pago' THEN COALESCE(valor_pago, valor) ELSE 0 END), 0) as total_pago,
          COUNT(CASE WHEN status = 'vencido' THEN 1 END) as contas_vencidas,
          COUNT(CASE WHEN data_vencimento = CURRENT_DATE AND status = 'pendente' THEN 1 END) as contas_vencendo_hoje,
          COUNT(CASE WHEN status = 'pendente' THEN 1 END) as contas_pendentes
        FROM contas_financeiras
        WHERE user_id = ${userId}
      `

      const resumo = result[0]
      const saldoLiquido = Number(resumo.total_recebido) - Number(resumo.total_pago)

      return {
        success: true,
        data: {
          total_receber: Number(resumo.total_receber),
          total_pagar: Number(resumo.total_pagar),
          total_recebido: Number(resumo.total_recebido),
          total_pago: Number(resumo.total_pago),
          saldo_liquido: saldoLiquido,
          contas_vencidas: Number(resumo.contas_vencidas),
          contas_vencendo_hoje: Number(resumo.contas_vencendo_hoje),
          contas_pendentes: Number(resumo.contas_pendentes),
        },
      }
    } catch (error) {
      console.error("Erro ao buscar resumo financeiro:", error)
      return { success: false, error: "Erro ao buscar resumo financeiro" }
    }
  }

  // Buscar indicadores financeiros
  static async getIndicadores(
    userId: number,
  ): Promise<{ success: boolean; data?: IndicadorFinanceiro[]; error?: string }> {
    try {
      const resumo = await this.getResumoFinanceiro(userId)
      if (!resumo.success || !resumo.data) {
        return { success: false, error: "Erro ao calcular indicadores" }
      }

      const { data } = resumo

      // Calcular variações (simuladas para demonstração)
      const indicadores: IndicadorFinanceiro[] = [
        {
          titulo: "Saldo Atual",
          valor: data.saldo_liquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          variacao: 12.5,
          tipo: data.saldo_liquido >= 0 ? "positivo" : "negativo",
          subtitulo: "Disponível em caixa",
        },
        {
          titulo: "A Receber (30 dias)",
          valor: data.total_receber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          variacao: 8.3,
          tipo: "positivo",
          subtitulo: "Próximos 30 dias",
        },
        {
          titulo: "A Pagar (30 dias)",
          valor: data.total_pagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
          variacao: -5.2,
          tipo: "negativo",
          subtitulo: "Próximos 30 dias",
        },
        {
          titulo: "Contas Pendentes",
          valor: data.contas_pendentes.toString(),
          variacao: -2.1,
          tipo: data.contas_pendentes > 0 ? "neutro" : "positivo",
          subtitulo: "Aguardando pagamento",
        },
      ]

      return { success: true, data: indicadores }
    } catch (error) {
      console.error("Erro ao calcular indicadores:", error)
      return { success: false, error: "Erro ao calcular indicadores" }
    }
  }

  // Buscar metas financeiras
  static async getMetas(userId: number) {
    try {
      const result = await sql`
        SELECT * FROM metas_financeiras
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `

      return { success: true, data: result }
    } catch (error) {
      console.error("Erro ao buscar metas:", error)
      return { success: false, error: "Erro ao buscar metas financeiras" }
    }
  }

  // Criar meta financeira
  static async createMeta(meta: Omit<MetaFinanceira, "id">) {
    try {
      const result = await sql`
        INSERT INTO metas_financeiras (titulo, tipo, valor_meta, valor_atual, prazo, user_id)
        VALUES (${meta.titulo}, ${meta.tipo}, ${meta.valor_meta}, ${meta.valor_atual}, ${meta.prazo}, ${meta.user_id})
        RETURNING *
      `

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Erro ao criar meta:", error)
      return { success: false, error: "Erro ao criar meta financeira" }
    }
  }

  // Atualizar status das contas vencidas
  static async updateContasVencidas() {
    try {
      const result = await sql`
        UPDATE contas_financeiras
        SET status = 'vencido'
        WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE
        RETURNING *
      `

      return { success: true, data: result }
    } catch (error) {
      console.error("Erro ao atualizar contas vencidas:", error)
      return { success: false, error: "Erro ao atualizar contas vencidas" }
    }
  }

  // Deletar conta
  static async deleteConta(id: number) {
    try {
      const result = await sql`
        DELETE FROM contas_financeiras
        WHERE id = ${id}
        RETURNING *
      `

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Erro ao deletar conta:", error)
      return { success: false, error: "Erro ao deletar conta financeira" }
    }
  }
}
