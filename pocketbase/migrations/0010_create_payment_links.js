migrate(
  (app) => {
    // 1. Criar coleção payment_links com RLS por usuário
    const collection = new Collection({
      name: 'payment_links',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != '' && user_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['product_link', 'fixed_qr'],
          maxSelect: 1,
        },
        {
          name: 'title',
          type: 'text',
          required: false,
        },
        {
          name: 'slug',
          type: 'text',
          required: false,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'amount_cents',
          type: 'number',
          required: false,
          onlyInt: true,
          min: 0,
        },
        {
          name: 'is_active',
          type: 'bool',
        },
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_payment_links_user ON payment_links (user_id)',
        'CREATE INDEX idx_payment_links_type ON payment_links (type)',
        'CREATE INDEX idx_payment_links_created ON payment_links (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('payment_links')
      app.delete(collection)
    } catch (_) {}
  },
)
