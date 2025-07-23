import { MercadoPagoConfig, Payment } from 'mercadopago';

interface PixPaymentData {
  saleId: string;
  amount: number;
  customerName?: string;
  customerCpf?: string;
  description?: string;
}

interface PixResponse {
  txid: string;
  qrcode: string;
  qrcodeImage: string;
  pixCopyPaste: string;
  expiresAt: Date;
  status: 'pending' | 'confirmed' | 'expired';
}

class PixService {
  private readonly client: MercadoPagoConfig;
  private readonly payment: Payment;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '',
      options: { timeout: 5000 },
    });
    this.payment = new Payment(this.client);
  }

  // Gerar TXID baseado no saleId
  generateTxid(saleId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ERP${saleId.slice(-4)}${timestamp.toString().slice(-6)}${random}`;
  }

  // Criar pagamento PIX com Mercado Pago
  async createPixPayment(data: PixPaymentData): Promise<PixResponse> {
    const { saleId, amount, customerName, customerCpf, description } = data;
    const txid = this.generateTxid(saleId);

    const body = {
      transaction_amount: Number(amount),
      description: description ?? `Venda ${saleId}`,
      payment_method_id: 'pix',
      payer: {
        email: customerCpf ? `${customerCpf}@pix.com` : `${customerName ?? 'cliente'}@pix.com`, // Email fictício
        first_name: customerName ?? 'Cliente',
        identification: customerCpf ? { type: 'CPF', number: customerCpf } : undefined,
      },
      external_reference: txid, // Usar txid como referência externa
    };

    try {
      const response = await this.payment.create({ body });

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      const qrcode = response.point_of_interaction?.transaction_data?.qr_code ?? '';
      const qrcodeImage = `data:image/png;base64,${response.point_of_interaction?.transaction_data?.qr_code_base64 ?? ''}`;
      const pixCopyPaste = qrcode;

      return {
        txid: (response.id?.toString() ?? 'unknown'), // Usar o ID do pagamento como txid ou 'unknown' como fallback
        qrcode,
        qrcodeImage,
        pixCopyPaste,
        expiresAt,
        status: 'pending',
      };
    } catch (error) {
      console.error('Erro ao criar PIX no Mercado Pago:', error);
      throw new Error('Erro ao criar PIX');
    }
  }

  // Verificar status do pagamento PIX
  async   checkPixStatus(txid: string): Promise<string> {
    try {
      const response = await this.payment.get({ id: txid });
      return response.status ?? 'unknown'; // Ex.: 'pending', 'approved', 'rejected'
    } catch (error) {
      console.error('Erro ao verificar status do PIX:', error);
      throw new Error('Erro ao verificar status do PIX');
    }
  }

  // Validar TXID
  async validateTxid(txId: string): Promise<boolean> {
    try {
      const payment = await this.payment.get({ id: txId });
      return !!payment.id;
    } catch {
      return false;
    }
  }

  // Verificar se o PIX expirou
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}

export const pixService = new PixService();