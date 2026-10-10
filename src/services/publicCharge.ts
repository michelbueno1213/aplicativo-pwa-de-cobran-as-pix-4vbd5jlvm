import pb from '@/lib/pocketbase/client'

export interface PublicChargeData {
  id: string
  amount_cents: number
  description?: string
  status: string
  is_simulated?: boolean
  pix_copia_cola?: string
  qr_image_url?: string
  expires_at?: string
  created?: string
  merchant_name: string
}

export const publicChargeService = {
  async getPublicCharge(id: string): Promise<PublicChargeData> {
    try {
      const res = await pb.send<PublicChargeData>(`/backend/v1/public/charges/${id}`, {
        method: 'GET',
      })
      return res
    } catch {
      // Fallback: se o endpoint público não responder ou em desenvolvimento local, tenta buscar direto via PB SDK
      try {
        const record = await pb.collection('charges').getOne(id)
        return {
          id: record.id,
          amount_cents: record.amount_cents,
          description: record.description,
          status: record.status,
          is_simulated: record.is_simulated,
          pix_copia_cola: record.pix_copia_cola,
          qr_image_url: record.qr_image_url,
          expires_at: record.expires_at,
          created: record.created,
          merchant_name: 'Comerciante ROM',
        }
      } catch {
        throw new Error('Cobrança não encontrada.')
      }
    }
  },
}
