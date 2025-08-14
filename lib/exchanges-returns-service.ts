import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface ExchangeReturn {
  id: number;
  number: string;
  type: "TROCA" | "DEVOLUCAO";
  originalSaleId?: number;
  originalSaleNumber?: string;
  customerId?: number;
  customerName?: string;
  userId: number;
  userName: string;
  reasonId: number;
  reasonDescription?: string;
  totalAmount: number;
  status: "PENDENTE" | "APROVADO" | "CONCLUIDO" | "REJEITADO" | "CANCELADO";
  approvedBy?: number;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: ExchangeReturnItem[];
}

export interface ExchangeReturnItem {
  id: number;
  exchangeReturnId: number;
  productId: number;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  newProductId?: number;
  newProductName?: string;
  newQuantity?: number;
  newUnitPrice?: number;
}

export interface ExchangeReturnReason {
  id: number;
  code: string;
  name: string;
  type: "TROCA" | "DEVOLUCAO" | "AMBOS";
  requiresApproval: boolean;
}

export interface ExchangeReturnStats {
  totalExchanges: number;
  totalReturns: number;
  totalValue: number;
  pendingCount: number;
  approvedCount: number;
  completedCount: number;
  rejectedCount: number;
  thisMonthExchanges: number;
  thisMonthReturns: number;
  thisMonthValue: number;
}

export class ExchangesReturnsService {
  // Buscar todas as trocas e devoluções com filtros
  static async getAll(
    filters: {
      search?: string;
      type?: string;
      status?: string;
      customerId?: number;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const {
        search,
        type,
        status,
        customerId,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0,
      } = filters;

      const customerIdNumber = customerId ? Number(customerId) : undefined;

      console.log("===================================", {
        search,
        type,
        status,
        customerId,
        typeofCustomerId: typeof customerId,
      });

      const conditions = [];

      if (search) {
        conditions.push(sql`(
    er.number ILIKE ${"%" + search + "%"} OR 
    er.customer_name ILIKE ${"%" + search + "%"} OR 
    er.original_sale_number ILIKE ${"%" + search + "%"}
  )`);
      }

      if (type) {
        conditions.push(sql`er.type = ${type}`);
      }

      if (status) {
        conditions.push(sql`er.status = ${status}`);
      }

      if (customerId) {
        conditions.push(sql`er.customer_id = ${Number(customerId)}`);
      }

      if (dateFrom) {
        conditions.push(sql`er.created_at >= ${dateFrom}`);
      }

      if (dateTo) {
        conditions.push(sql`er.created_at <= ${dateTo}`);
      }

      const whereClause =
        conditions.length > 0
          ? sql`WHERE ${conditions.map((condition, index) =>
              index === 0 ? condition : sql`AND ${condition}`
            )}`
          : sql``;

      const exchangesReturns = await sql`
        SELECT 
          er.*,
          err.name as reason_name,
          u.name as user_name,
          c.name as customer_name
        FROM exchanges_returns er
        LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
        LEFT JOIN users u ON er.user_id = u.id
        LEFT JOIN customers c ON er.customer_id = c.id
        ${whereClause}
        ORDER BY er.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Buscar itens para cada troca/devolução
      for (const er of exchangesReturns) {
        const items = await sql`
          SELECT 
            eri.*,
            p.name as "product_name",
            p.code as product_code,
            np.name as new_product_name
          FROM exchange_return_items eri
          LEFT JOIN products p ON eri.product_id = p.id
          LEFT JOIN products np ON eri.new_product_id = np.id
          WHERE eri.exchange_return_id = ${er.id}
          ORDER BY eri.id
        `;
        er.items = items;
      }

      return Array.isArray(exchangesReturns) ? exchangesReturns : [];
    } catch (error) {
      console.error("Erro ao buscar trocas/devoluções:", error);
      return [];
    }
  }

  // Buscar por ID
  static async getById(id: number) {
    try {
      const exchangeReturn = await sql`
        SELECT 
          er.*,
          err.name as reason_name,
          u.name as user_name,
          c.name as customer_name,
          s.number as original_sale_number
        FROM exchanges_returns er
        LEFT JOIN exchange_return_reasons err ON er.reason_id = err.id
        LEFT JOIN users u ON er.user_id = u.id
        LEFT JOIN customers c ON er.customer_id = c.id
        LEFT JOIN sales s ON er.original_sale_id = s.id
        WHERE er.id = ${id}
      `;

      if (exchangeReturn.length === 0) {
        return null;
      }

      const items = await sql`
        SELECT 
          eri.*,
          p.name as "product_name",
          p.code as product_code,
          np.name as new_product_name
        FROM exchange_return_items eri
        LEFT JOIN products p ON eri.product_id = p.id
        LEFT JOIN products np ON eri.new_product_id = np.id
        WHERE eri.exchange_return_id = ${id}
        ORDER BY eri.id
      `;

      return {
        ...exchangeReturn[0],
        items,
      };
    } catch (error) {
      console.error("Erro ao buscar troca/devolução:", error);
      throw error;
    }
  }

  // Criar nova troca/devolução
  static async create(data: {
    type: "TROCA" | "DEVOLUCAO";
    originalSaleId?: number;
    customerId?: number;
    customerName?: string;
    userId: number;
    reasonId: number;
    reasonDescription?: string;
    notes?: string;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      newProductId?: number;
      newQuantity?: number;
      newUnitPrice?: number;
    }>;
  }) {
    try {
      // Gerar número sequencial
      const numberResult =
        await sql`SELECT generate_exchange_return_number(${data.type}) as number`;
      const number = numberResult[0].number;

      // Calcular valor total
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      // Criar registro principal
      const exchangeReturn = await sql`
        INSERT INTO exchanges_returns (
          number, type, original_sale_id, customer_id, customer_name,
          user_id, reason_id, reason_description, total_amount, notes
        ) VALUES (
          ${number}, ${data.type}, ${data.originalSaleId || null}, 
          ${data.customerId || null}, ${data.customerName || null},
          ${data.userId}, ${data.reasonId}, ${data.reasonDescription || null},
          ${totalAmount}, ${data.notes || null}
        ) RETURNING *
      `;

      const exchangeReturnId = exchangeReturn[0].id;

      // Criar itens
      for (const item of data.items) {
        await sql`
          INSERT INTO exchange_return_items (
            exchange_return_id, product_id, quantity, unit_price, total_price,
            new_product_id, new_quantity, new_unit_price
          ) VALUES (
            ${exchangeReturnId}, ${item.productId}, ${item.quantity}, 
            ${item.unitPrice}, ${item.quantity * item.unitPrice},
            ${item.newProductId || null}, ${item.newQuantity || 0}, 
            ${item.newUnitPrice || 0}
          )
        `;
      }

      return await this.getById(exchangeReturnId);
    } catch (error) {
      console.error("Erro ao criar troca/devolução:", error);
      throw error;
    }
  }

  // Atualizar status
  static async updateStatus(id: number, status: string, userId?: number) {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };

      if (status === "APROVADO" && userId) {
        updateData.approved_by = userId;
        updateData.approved_at = new Date().toISOString();
      }

      if (status === "CONCLUIDO") {
        updateData.completed_at = new Date().toISOString();
      }

      await sql`
        UPDATE exchanges_returns 
        SET 
          status = ${status},
          approved_by = ${updateData.approved_by || null},
          approved_at = ${updateData.approved_at || null},
          completed_at = ${updateData.completed_at || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      return await this.getById(id);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      throw error;
    }
  }

  // Buscar motivos
  static async getReasons(type?: string) {
    try {
      if (type) {
        return await sql`
          SELECT * FROM exchange_return_reasons 
          WHERE type = ${type} OR type = 'AMBOS'
          ORDER BY name
        `;
      } else {
        return await sql`
          SELECT * FROM exchange_return_reasons 
          ORDER BY type, name
        `;
      }
    } catch (error) {
      console.error("Erro ao buscar motivos:", error);
      throw error;
    }
  }

  // Estatísticas
  static async getStats(): Promise<ExchangeReturnStats> {
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN type = 'TROCA' THEN 1 END) as total_exchanges,
          COUNT(CASE WHEN type = 'DEVOLUCAO' THEN 1 END) as total_returns,
          COALESCE(SUM(total_amount), 0) as total_value,
          COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'APROVADO' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'REJEITADO' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN type = 'TROCA' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_exchanges,
          COUNT(CASE WHEN type = 'DEVOLUCAO' AND created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_returns,
          COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as this_month_value
        FROM exchanges_returns
      `;

      return {
        totalExchanges: Number.parseInt(stats[0].total_exchanges) || 0,
        totalReturns: Number.parseInt(stats[0].total_returns) || 0,
        totalValue: Number.parseFloat(stats[0].total_value) || 0,
        pendingCount: Number.parseInt(stats[0].pending_count) || 0,
        approvedCount: Number.parseInt(stats[0].approved_count) || 0,
        completedCount: Number.parseInt(stats[0].completed_count) || 0,
        rejectedCount: Number.parseInt(stats[0].rejected_count) || 0,
        thisMonthExchanges: Number.parseInt(stats[0].this_month_exchanges) || 0,
        thisMonthReturns: Number.parseInt(stats[0].this_month_returns) || 0,
        thisMonthValue: Number.parseFloat(stats[0].this_month_value) || 0,
      };
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return {
        totalExchanges: 0,
        totalReturns: 0,
        totalValue: 0,
        pendingCount: 0,
        approvedCount: 0,
        completedCount: 0,
        rejectedCount: 0,
        thisMonthExchanges: 0,
        thisMonthReturns: 0,
        thisMonthValue: 0,
      };
    }
  }
}
