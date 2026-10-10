import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface PaymentLinkRecord extends RecordModel {
  type: 'product_link' | 'fixed_qr'
  title?: string
  slug?: string
  description?: string
  amount_cents?: number
  is_active?: boolean
  user_id: string
}

export interface CreatePaymentLinkInput {
  type: 'product_link' | 'fixed_qr'
  title?: string
  slug?: string
  description?: string
  amount_cents?: number
  is_active?: boolean
}

export const paymentLinksService = {
  async list(type?: 'product_link' | 'fixed_qr'): Promise<PaymentLinkRecord[]> {
    const filter = type ? `type = '${type}'` : ''
    return pb.collection<PaymentLinkRecord>('payment_links').getFullList({
      filter,
      sort: '-created',
    })
  },

  async create(data: CreatePaymentLinkInput): Promise<PaymentLinkRecord> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    return pb.collection<PaymentLinkRecord>('payment_links').create({
      ...data,
      user_id: userId,
      is_active: data.is_active ?? true,
    })
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection<PaymentLinkRecord>('payment_links').delete(id)
  },
}
