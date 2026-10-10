import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface LiquidWalletRecord extends RecordModel {
  label: string
  address: string
  is_default?: boolean
  user_id: string
}

export interface CreateLiquidWalletInput {
  label: string
  address: string
  is_default?: boolean
}

export const liquidWalletsService = {
  async list(): Promise<LiquidWalletRecord[]> {
    return pb.collection<LiquidWalletRecord>('liquid_wallets').getFullList({
      sort: '-is_default,-created',
    })
  },

  async create(data: CreateLiquidWalletInput): Promise<LiquidWalletRecord> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    return pb.collection<LiquidWalletRecord>('liquid_wallets').create({
      ...data,
      user_id: userId,
    })
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection<LiquidWalletRecord>('liquid_wallets').delete(id)
  },
}
