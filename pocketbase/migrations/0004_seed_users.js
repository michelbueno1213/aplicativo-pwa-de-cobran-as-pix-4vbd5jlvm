migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const email = 'jmrepresentacoesmichelbueno@gmail.com'

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', email)
      return // Já existe
    } catch (_) {}

    const record = new Record(users)
    record.setEmail(email)
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Michel Bueno')
    record.set('pix_key', 'jmrepresentacoesmichelbueno@gmail.com')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'jmrepresentacoesmichelbueno@gmail.com',
      )
      app.delete(record)
    } catch (_) {}
  },
)
