migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('pix_key')) {
      users.fields.add(
        new TextField({
          name: 'pix_key',
          required: false,
        }),
      )
      app.save(users)
    }
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const field = users.fields.getByName('pix_key')
      if (field) {
        users.fields.remove(field)
        app.save(users)
      }
    } catch (_) {}
  },
)
