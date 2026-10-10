migrate(
  (app) => {
    // 1. Atualizar a coleção users com role e is_admin (bloqueado para edição do próprio usuário)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['merchant', 'admin'],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('is_admin')) {
      users.fields.add(
        new BoolField({
          name: 'is_admin',
        }),
      )
    }
    // Proteger update de role pelo próprio usuário
    users.updateRule =
      'id = @request.auth.id && @request.body.role:changed = false && @request.body.is_admin:changed = false'
    app.save(users)

    // Marcar usuário principal como admin
    try {
      const adminUser = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'jmrepresentacoesmichelbueno@gmail.com',
      )
      adminUser.set('role', 'admin')
      adminUser.set('is_admin', true)
      app.save(adminUser)
    } catch (_) {}

    // 2. Modificar charges para suportar dados reais e documentados da API Pix2DePix Eulen
    const charges = app.findCollectionByNameOrId('charges')

    // Atualizar campo status para incluir todos os status documentados pela Eulen + legados
    const statusField = charges.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'pending',
        'under_review',
        'approved',
        'depix_sent',
        'delayed',
        'refunded',
        'canceled',
        'expired',
        'error',
        'unknown',
        'will_refund',
        'under_bank_review',
        'paid', // legado
        'cancelled', // legado
      ]
    }

    // Flag is_simulated para arquivar registros simulados separadamente
    if (!charges.fields.getByName('is_simulated')) {
      charges.fields.add(
        new BoolField({
          name: 'is_simulated',
        }),
      )
    }

    // Identificador oficial do depósito Eulen (qrId)
    if (!charges.fields.getByName('eulen_deposit_id')) {
      charges.fields.add(
        new TextField({
          name: 'eulen_deposit_id',
          required: false,
        }),
      )
    }

    // Identificador da transação Pix no banco (bankTxId retornado pela Eulen)
    if (!charges.fields.getByName('bank_tx_id')) {
      charges.fields.add(
        new TextField({
          name: 'bank_tx_id',
          required: false,
        }),
      )
    }

    // Identificador da transação Liquid real (blockchainTxID retornado pela Eulen quando status = depix_sent)
    if (!charges.fields.getByName('blockchain_tx_id')) {
      charges.fields.add(
        new TextField({
          name: 'blockchain_tx_id',
          required: false,
        }),
      )
    }

    // URL do QR Code hospedado pela Eulen (qrImageUrl)
    if (!charges.fields.getByName('qr_image_url')) {
      charges.fields.add(
        new TextField({
          name: 'qr_image_url',
          required: false,
        }),
      )
    }

    // Identificador EUID do pagador (payerEUID retornado pela Eulen)
    if (!charges.fields.getByName('payer_euid')) {
      charges.fields.add(
        new TextField({
          name: 'payer_euid',
          required: false,
        }),
      )
    }

    // CPF / CNPJ do pagador (payerTaxNumber)
    if (!charges.fields.getByName('payer_tax_number')) {
      charges.fields.add(
        new TextField({
          name: 'payer_tax_number',
          required: false,
        }),
      )
    }

    // Nome oficial do pagador (payerName retornado pela Eulen)
    if (!charges.fields.getByName('payer_name')) {
      charges.fields.add(
        new TextField({
          name: 'payer_name',
          required: false,
        }),
      )
    }

    // Data delayUntil para pagamentos em análise/retidos pela Eulen
    if (!charges.fields.getByName('delay_until')) {
      charges.fields.add(
        new DateField({
          name: 'delay_until',
          required: false,
        }),
      )
    }

    // Data de envio do DePix na Liquid (depix_sent_at)
    if (!charges.fields.getByName('depix_sent_at')) {
      charges.fields.add(
        new DateField({
          name: 'depix_sent_at',
          required: false,
        }),
      )
    }

    // Chave de idempotência enviada pelo cliente do comerciante
    if (!charges.fields.getByName('idempotency_key')) {
      charges.fields.add(
        new TextField({
          name: 'idempotency_key',
          required: false,
        }),
      )
    }

    // Regra RLS:
    // Usuários comuns (comerciantes) só listam e veem suas próprias cobranças.
    // Usuários com @request.auth.is_admin = true ou role = 'admin' podem ver também para suporte/homologação.
    // Impossibilitar que qualquer usuário comum altere o status de uma cobrança não simulada
    charges.listRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.is_admin = true)"
    charges.viewRule =
      "@request.auth.id != '' && (user_id = @request.auth.id || @request.auth.is_admin = true)"
    charges.createRule = "@request.auth.id != '' && user_id = @request.auth.id"
    charges.updateRule =
      "@request.auth.id != '' && ((user_id = @request.auth.id && is_simulated = true) || @request.auth.is_admin = true)"
    charges.deleteRule =
      "@request.auth.id != '' && ((user_id = @request.auth.id && is_simulated = true) || @request.auth.is_admin = true)"

    app.save(charges)

    // Adicionar índices úteis
    charges.addIndex('idx_charges_simulated', false, 'is_simulated', '')
    charges.addIndex('idx_charges_eulen_id', false, 'eulen_deposit_id', '')
    charges.addIndex('idx_charges_idempotency', false, 'user_id, idempotency_key', '')
    app.save(charges)

    // 3. Atualizar registros existentes de charges para is_simulated = true (arquivamento de registros simulados)
    app
      .db()
      .newQuery(
        "UPDATE charges SET is_simulated = 1 WHERE is_simulated IS NULL OR payment_method = 'simulated'",
      )
      .execute()
  },
  (app) => {
    // Reverter mudanças adicionais
    try {
      const charges = app.findCollectionByNameOrId('charges')
      charges.removeIndex('idx_charges_simulated')
      charges.removeIndex('idx_charges_eulen_id')
      charges.removeIndex('idx_charges_idempotency')
      app.save(charges)
    } catch (_) {}
  },
)
