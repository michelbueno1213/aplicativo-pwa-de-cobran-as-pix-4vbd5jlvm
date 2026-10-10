import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface CustomerRecord extends RecordModel {
  name: string
  email?: string
  phone?: string
  pix_key?: string
  user_id: string
}

export interface CreateCustomerInput {
  name: string
  email?: string
  phone?: string
  pix_key?: string
}

export const customersService = {
  async list(
    params: {
      page?: number
      perPage?: number
      filter?: string
      sort?: string
    } = {},
  ) {
    const { page = 1, perPage = 50, filter = '', sort = '-created' } = params
    return pb.collection<CustomerRecord>('customers').getList(page, perPage, {
      filter,
      sort,
    })
  },

  async getAll() {
    return pb.collection<CustomerRecord>('customers').getFullList({
      sort: 'name',
    })
  },

  async getById(id: string) {
    return pb.collection<CustomerRecord>('customers').getOne(id)
  },

  async create(data: CreateCustomerInput) {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado')

    return pb.collection<CustomerRecord>('customers').create({
      ...data,
      user_id: userId,
    })
  },

  async update(id: string, data: Partial<CreateCustomerInput>) {
    return pb.collection<CustomerRecord>('customers').update(id, data)
  },

  async delete(id: string) {
    return pb.collection<CustomerRecord>('customers').delete(id)
  },
}
