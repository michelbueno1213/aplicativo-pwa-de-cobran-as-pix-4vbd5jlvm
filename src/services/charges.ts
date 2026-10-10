import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface ChargeRecord extends RecordModel {
  customer_name?: string
  amount_cents: number
  pix_key?: string
  liquid_address?: string
  liquid_wallet_id?: string
  pix_copia_cola?: string
  provider_fee_cents?: number
  rom_fee_cents?: number
  net_depix_amount_cents?: number
  description?: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payment_link?: string
  payment_method: 'simulated' | 'real'
  paid_at?: string
  expires_at?: string
  user_id: string
}

export interface CreateChargeInput {
  customer_name?: string
  amount_cents: number
  liquid_address: string
  liquid_wallet_id?: string
  pix_key?: string
  description?: string
  payment_method?: 'simulated' | 'real'
  expires_at?: string
  provider_fee_cents?: number
  rom_fee_cents?: number
  net_depix_amount_cents?: number
}

export const chargesService = {
  async list(
    params: {
      page?: number
      perPage?: number
      filter?: string
      sort?: string
    } = {},
  ) {
    const { page = 1, perPage = 10, filter = '', sort = '-created' } = params
    return pb.collection<ChargeRecord>('charges').getList(page, perPage, {
      filter,
      sort,
    })
  },

  async getById(id: string) {
    return pb.collection<ChargeRecord>('charges').getOne(id)
  },

  async create(data: CreateChargeInput) {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    // Gerar link simulado de pagamento Pix e payload Copia e Cola claramente fictício
    const fakeId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const simulatedLink = `https://rom.app/pay/sim_${fakeId}`
    const fakeTxId = `SIMROM${Date.now().toString(36).toUpperCase()}${fakeId}`
    const simulatedCopiaECola = `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${fakeId}520400005303986540${(data.amount_cents / 100).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`

    // Prazo de validade padrão: 24 horas a partir de agora
    const defaultExpiresAt =
      data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const payload = {
      ...data,
      user_id: userId,
      status: 'pending',
      payment_method: data.payment_method || 'simulated',
      payment_link: simulatedLink,
      pix_copia_cola: simulatedCopiaECola,
      expires_at: defaultExpiresAt,
      // Se não houver pix_key manual, usa a indicação de chave gerada automaticamente pela provedora (modo simulado)
      pix_key: data.pix_key || `simulado-${fakeTxId.toLowerCase()}@rom.app`,
    }

    return pb.collection<ChargeRecord>('charges').create(payload)
  },

  async markAsPaid(id: string) {
    return pb.collection<ChargeRecord>('charges').update(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
  },

  async cancel(id: string) {
    return pb.collection<ChargeRecord>('charges').update(id, {
      status: 'cancelled',
    })
  },

  async delete(id: string) {
    return pb.collection<ChargeRecord>('charges').delete(id)
  },

  async getAllForKpis() {
    return pb.collection<ChargeRecord>('charges').getFullList({
      sort: '-created',
      fields: 'id,customer_name,amount_cents,status,created,paid_at',
    })
  },
}
