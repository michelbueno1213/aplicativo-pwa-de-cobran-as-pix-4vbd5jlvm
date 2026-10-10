migrate(
  (app) => {
    const collection = new Collection({
      name: 'charges',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        { name: 'customer_name', type: 'text', required: true },
        { name: 'amount_cents', type: 'number', required: true, onlyInt: true, min: 1 },
        { name: 'pix_key', type: 'text', required: true },
        { name: 'description', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'paid', 'expired', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'payment_link', type: 'text' },
        {
          name: 'payment_method',
          type: 'select',
          required: true,
          values: ['simulated', 'real'],
          maxSelect: 1,
        },
        { name: 'paid_at', type: 'date' },
        { name: 'expires_at', type: 'date' },
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
        'CREATE INDEX idx_charges_status ON charges (status)',
        'CREATE INDEX idx_charges_user ON charges (user_id)',
        'CREATE INDEX idx_charges_created ON charges (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('charges')
      app.delete(collection)
    } catch (_) {}
  },
)
