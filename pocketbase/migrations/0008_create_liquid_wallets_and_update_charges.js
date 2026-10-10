migrate(
  (app) => {
    // 1. Criar coleção liquid_wallets para o usuário armazenar carteiras Liquid/DePix
    const liquidWallets = new Collection({
      name: 'liquid_wallets',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'address', type: 'text', required: true },
        { name: 'is_default', type: 'bool' },
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_wallets_user ON liquid_wallets (user_id)',
        'CREATE INDEX idx_wallets_created ON liquid_wallets (created DESC)',
      ],
    })
    app.save(liquidWallets)

    // 2. Modificar charges para permitir pix_key opcional e adicionar campos de carteira Liquid / qr / payload
    const charges = app.findCollectionByNameOrId('charges')

    // Tornar pix_key não-obrigatório (gerado automaticamente pela provedora quando habilitada)
    const pixKeyField = charges.fields.getByName('pix_key')
    if (pixKeyField) {
      pixKeyField.required = false
    }

    // Tornar customer_name opcional
    const customerNameField = charges.fields.getByName('customer_name')
    if (customerNameField) {
      customerNameField.required = false
    }

    // Adicionar campo liquid_address (endereço da carteira Liquid de recebimento)
    if (!charges.fields.getByName('liquid_address')) {
      charges.fields.add(
        new TextField({
          name: 'liquid_address',
          required: false,
        }),
      )
    }

    // Adicionar campo liquid_wallet_id (referência à carteira liquid cadastrada, se houver)
    if (!charges.fields.getByName('liquid_wallet_id')) {
      charges.fields.add(
        new RelationField({
          name: 'liquid_wallet_id',
          required: false,
          collectionId: liquidWallets.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // Adicionar campo pix_copia_cola para armazenar o payload Pix gerado (simulado ou da API parceira)
    if (!charges.fields.getByName('pix_copia_cola')) {
      charges.fields.add(
        new TextField({
          name: 'pix_copia_cola',
          required: false,
        }),
      )
    }

    // Adicionar campo provider_fee_cents e rom_fee_cents para registrar taxas estimadas
    if (!charges.fields.getByName('provider_fee_cents')) {
      charges.fields.add(
        new NumberField({
          name: 'provider_fee_cents',
          required: false,
          min: 0,
        }),
      )
    }

    if (!charges.fields.getByName('rom_fee_cents')) {
      charges.fields.add(
        new NumberField({
          name: 'rom_fee_cents',
          required: false,
          min: 0,
        }),
      )
    }

    if (!charges.fields.getByName('net_depix_amount_cents')) {
      charges.fields.add(
        new NumberField({
          name: 'net_depix_amount_cents',
          required: false,
          min: 0,
        }),
      )
    }

    app.save(charges)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('liquid_wallets')
      app.delete(col)
    } catch (_) {}
  },
)
