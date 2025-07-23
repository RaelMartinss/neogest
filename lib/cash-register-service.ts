import { query } from "./db"

export async function getCashRegister(userId: string) {
  try {
    const result = await query("SELECT * FROM cash_registers WHERE user_id = $1 AND is_open = true", [userId])

    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Erro ao buscar caixa:", error)
    return null
  }
}

export async function openCashRegister(userId: string, userName: string, openingAmount: number) {
  try {
    // Verificar se já existe um caixa aberto para o usuário
    const existingCashRegister = await getCashRegister(userId)

    if (existingCashRegister) {
      throw new Error("Já existe um caixa aberto para este usuário")
    }

    const result = await query(
      `INSERT INTO cash_registers (
        user_id, user_name, opening_amount, current_amount,
        total_sales, total_cash, total_card, total_pix,
        is_open, opened_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [userId, userName, openingAmount, openingAmount, 0, 0, 0, 0, true],
    )

    return result[0]
  } catch (error) {
    console.error("Erro ao abrir caixa:", error)
    throw error
  }
}

export async function closeCashRegister(userId: string) {
  try {
    const cashRegister = await getCashRegister(userId)

    if (!cashRegister) {
      throw new Error("Nenhum caixa aberto encontrado")
    }

    const result = await query(
      `UPDATE cash_registers 
       SET is_open = false, closed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [cashRegister.id],
    )

    return result[0]
  } catch (error) {
    console.error("Erro ao fechar caixa:", error)
    throw error
  }
}

export async function updateCashRegisterSale(userId: string, amount: number, paymentMethod: string) {
  try {
    const cashRegister = await getCashRegister(userId)

    if (!cashRegister) {
      throw new Error("Nenhum caixa aberto encontrado")
    }

    let totalCash = cashRegister.total_cash
    let totalCard = cashRegister.total_card
    let totalPix = cashRegister.total_pix

    // Atualizar valores baseado no método de pagamento
    switch (paymentMethod) {
      case "cash":
        totalCash += amount
        break
      case "credit_card":
      case "debit_card":
        totalCard += amount
        break
      case "pix":
        totalPix += amount
        break
    }

    const result = await query(
      `UPDATE cash_registers 
       SET current_amount = opening_amount + $1 + $2 + $3,
           total_sales = $1 + $2 + $3,
           total_cash = $1,
           total_card = $2,
           total_pix = $3
       WHERE id = $4
       RETURNING *`,
      [totalCash, totalCard, totalPix, cashRegister.id],
    )

    return result[0]
  } catch (error) {
    console.error("Erro ao atualizar caixa:", error)
    throw error
  }
}
