import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface ChargeRecord extends RecordModel {
  customer_name: string
  amount_cents: number
  pix_key: string
  description?: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payment_link?: string
  payment_method: 'simulated' | 'real'
  paid_at?: string
  expires_at?: string
  user_id: string
}

export interface CreateChargeInput {
  customer_name: string
  amount_cents: number
  pix_key: string
  description?: string
  payment_method?: 'simulated' | 'real'
  expires_at?: string
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

    // Gerar link simulado de pagamento Pix
    const fakeId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const simulatedLink = `https://rom.app/pay/sim_${fakeId}`

    const payload = {
      ...data,
      user_id: userId,
      status: 'pending',
      payment_method: data.payment_method || 'simulated',
      payment_link: simulatedLink,
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
