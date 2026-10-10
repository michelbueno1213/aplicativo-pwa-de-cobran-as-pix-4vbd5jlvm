import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'
import type { ChargeStatus } from '@/components/StatusBadge'

export interface ChargeRecord extends RecordModel {
  customer_name?: string
  amount_cents: number
  pix_key?: string
  liquid_address?: string
  liquid_wallet_id?: string
  pix_copia_cola?: string
  qr_image_url?: string
  provider_fee_cents?: number
  rom_fee_cents?: number
  net_depix_amount_cents?: number
  description?: string
  status: ChargeStatus
  payment_link?: string
  payment_method: 'simulated' | 'real'
  is_simulated?: boolean
  paid_at?: string
  expires_at?: string
  user_id: string
  // Campos documentados da integração Eulen Pix2DePix
  eulen_deposit_id?: string
  bank_tx_id?: string
  blockchain_tx_id?: string
  payer_euid?: string
  payer_tax_number?: string
  payer_name?: string
  delay_until?: string
  depix_sent_at?: string
  idempotency_key?: string
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
  is_simulated?: boolean
  idempotency_key?: string
}

export interface EulenBackendStatus {
  ready: boolean
  message: string
  environment: string
  endpoints_prepared: string[]
}

export const chargesService = {
  /**
   * Consulta o status de prontidão da integração no backend.
   */
  async checkIntegrationStatus(): Promise<EulenBackendStatus> {
    try {
      const res = await pb.send<EulenBackendStatus>('/backend/v1/eulen/status', {
        method: 'GET',
      })
      return res
    } catch {
      return {
        ready: false,
        message:
          'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
        environment: 'inactive',
        endpoints_prepared: [],
      }
    }
  },

  /**
   * Lista apenas cobranças de produção por padrão (ou simuladas quando solicitado explicitamente).
   * Garante a separação estrita de registros simulados.
   */
  async list(
    params: {
      page?: number
      perPage?: number
      filter?: string
      sort?: string
      includeSimulated?: boolean
    } = {},
  ) {
    const {
      page = 1,
      perPage = 10,
      filter = '',
      sort = '-created',
      includeSimulated = false,
    } = params

    const conditions: string[] = []

    // Arquivar/separar registros simulados da visão pública de produção
    if (!includeSimulated) {
      conditions.push('is_simulated != true')
    } else {
      conditions.push('is_simulated = true')
    }

    if (filter) {
      conditions.push(`(${filter})`)
    }

    const finalFilter = conditions.join(' && ')

    return pb.collection<ChargeRecord>('charges').getList(page, perPage, {
      filter: finalFilter,
      sort,
    })
  },

  async getById(id: string) {
    return pb.collection<ChargeRecord>('charges').getOne(id)
  },

  /**
   * Criação de cobrança via backend Eulen se disponível, ou bloqueio seguro com mensagem oficial.
   * Não emite cobranças reais sem credenciais válidas.
   */
  async create(data: CreateChargeInput) {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    // Tentar criação via backend seguro da integração Eulen
    try {
      const res = await pb.send<{
        charge: ChargeRecord
        eulen_deposit_id?: string
        qrCopyPaste?: string
        qrImageUrl?: string
      }>('/backend/v1/eulen/charges/create', {
        method: 'POST',
        body: {
          amount_cents: data.amount_cents,
          liquid_address: data.liquid_address,
          customer_name: data.customer_name,
          description: data.description,
          idempotency_key:
            data.idempotency_key ||
            `ROM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
      })

      if (res && res.charge) {
        return res.charge
      }
    } catch (err: unknown) {
      // Se a integração ainda não tem credenciais ativas, repassa a mensagem oficial
      const pbErr = err as { data?: { message?: string; error?: string } }
      if (pbErr?.data?.message) {
        throw new Error(pbErr.data.message)
      }
    }

    // Enquanto não existir uma integração aprovada, apresentar exatamente a mensagem exigida:
    throw new Error(
      'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
    )
  },

  /**
   * Sincroniza o status oficial consultando a Eulen através do backend seguro.
   */
  async syncStatus(chargeId: string) {
    return pb.send<{ charge: ChargeRecord; synced: boolean }>(
      `/backend/v1/eulen/charges/${chargeId}/sync`,
      { method: 'GET' },
    )
  },

  /**
   * Ambiente privado de homologação / simulação para administradores.
   * Cria cobrança no ambiente de testes sem misturar com produção.
   */
  async createSimulatedForAdmin(data: CreateChargeInput) {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    const fakeId = Math.random().toString(36).substring(2, 10).toUpperCase()
    const simulatedLink = `https://rom.app/pay/sim_${fakeId}`
    const fakeTxId = `SIMROM${Date.now().toString(36).toUpperCase()}${fakeId}`
    const simulatedCopiaECola = `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${fakeId}520400005303986540${(
      data.amount_cents / 100
    ).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`

    const defaultExpiresAt =
      data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const payload = {
      ...data,
      user_id: userId,
      status: 'pending',
      payment_method: 'simulated',
      is_simulated: true,
      payment_link: simulatedLink,
      pix_copia_cola: simulatedCopiaECola,
      expires_at: defaultExpiresAt,
      pix_key: data.pix_key || `simulado-${fakeTxId.toLowerCase()}@rom.app`,
    }

    return pb.collection<ChargeRecord>('charges').create(payload)
  },

  /**
   * Permitido APENAS no ambiente de homologação para registros simulados
   */
  async markAsPaidSimulated(id: string) {
    return pb.collection<ChargeRecord>('charges').update(id, {
      status: 'depix_sent',
      paid_at: new Date().toISOString(),
      depix_sent_at: new Date().toISOString(),
    })
  },

  async cancelSimulated(id: string) {
    return pb.collection<ChargeRecord>('charges').update(id, {
      status: 'canceled',
    })
  },

  async deleteSimulated(id: string) {
    return pb.collection<ChargeRecord>('charges').delete(id)
  },

  /**
   * Resumo para KPIs: ignora registros simulados por padrão,
   * calculando apenas liquidações reais recebidas em carteiras externas.
   */
  async getAllForKpis(includeSimulated = false) {
    const filter = includeSimulated ? 'is_simulated = true' : 'is_simulated != true'
    return pb.collection<ChargeRecord>('charges').getFullList({
      filter,
      sort: '-created',
      fields:
        'id,customer_name,amount_cents,status,created,paid_at,depix_sent_at,blockchain_tx_id,is_simulated,net_depix_amount_cents,liquid_address',
    })
  },
}
