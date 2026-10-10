/**
 * Backend Hooks para Integração com a API Pix2DePix da Eulen
 * Documentação oficial: https://docs.eulen.app/
 * URL base oficial: https://depix.eulen.app/api/
 *
 * Todas as funções auxiliares são declaradas inline em cada callback devido ao modelo de VM pool do PocketBase.
 */

routerAdd('GET', '/backend/v1/eulen/status', (e) => {
  const clientId = $os.getenv('EULEN_CLIENT_ID') || ''
  const clientSecret = $os.getenv('EULEN_CLIENT_SECRET') || ''
  const legacyToken = $os.getenv('EULEN_API_TOKEN') || ''
  const isConfigured = Boolean((clientId && clientSecret) || legacyToken)

  return e.json(200, {
    ready: isConfigured,
    message: isConfigured
      ? 'Integração Eulen configurada no servidor.'
      : 'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
    environment: isConfigured ? 'production' : 'inactive',
    endpoints_prepared: [
      'POST /deposit (Pix2DePix)',
      'GET /deposit-status',
      'GET /deposits (Reconciliation)',
      'POST /webhook/deposit',
    ],
  })
})

/**
 * Endpoint de Criação de Cobrança com Idempotência
 * Protegido por autenticação do comerciante logado.
 * BLOQUEADO enquanto não houver credenciais reais configuradas.
 */
routerAdd(
  'POST',
  '/backend/v1/eulen/charges/create',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const clientId = $os.getenv('EULEN_CLIENT_ID') || ''
      const clientSecret = $os.getenv('EULEN_CLIENT_SECRET') || ''
      const legacyToken = $os.getenv('EULEN_API_TOKEN') || ''
      const romSplitAddress = $os.getenv('ROM_DEPIX_SPLIT_ADDRESS') || ''
      const romSplitFeePercent = $os.getenv('ROM_SPLIT_FEE_PERCENT') || ''
      const isConfigured = Boolean((clientId && clientSecret) || legacyToken)

      if (!isConfigured) {
        return e.json(400, {
          error: 'INTEGRATION_PENDING',
          message:
            'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
        })
      }

      const body = e.requestInfo().body || {}
      const amountCents = parseInt(body.amount_cents, 10)
      const liquidAddress = (body.liquid_address || '').trim()
      const customerName = (body.customer_name || '').trim()
      const description = (body.description || '').trim()
      const idempotencyKey = (body.idempotency_key || '').trim()
      const endUserFullName = (body.endUserFullName || customerName || '').trim()
      const endUserTaxNumber = (body.endUserTaxNumber || '').replace(/\D/g, '')

      if (!amountCents || amountCents <= 0) {
        return e.badRequestError('amount_cents inválido (mínimo 1 centavo)')
      }

      if (!liquidAddress) {
        return e.badRequestError('liquid_address é obrigatório')
      }

      // Validação de idempotência para evitar geração duplicada
      if (idempotencyKey) {
        try {
          const existing = $app.findFirstRecordByData('charges', 'idempotency_key', idempotencyKey)
          if (existing && existing.getString('user_id') === userId) {
            return e.json(200, {
              charge: existing,
              idempotent: true,
            })
          }
        } catch (_) {}
      }

      // Obter token Bearer Eulen
      let token = legacyToken
      if (!token && clientId && clientSecret) {
        const authResp = $http.send({
          url: 'https://depix.eulen.app/api/v2/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
          }),
          timeout: 15,
        })
        if (authResp.statusCode !== 200) {
          return e.json(502, {
            error: 'EULEN_AUTH_ERROR',
            message: 'Falha na autenticação com a provedora Eulen',
          })
        }
        const authData = JSON.parse(authResp.raw)
        token = authData.access_token
      }

      // Montar payload documentado da Eulen: POST /deposit
      const eulenPayload = {
        amountInCents: amountCents,
        depixAddress: liquidAddress,
      }

      if (endUserFullName) eulenPayload.endUserFullName = endUserFullName
      if (endUserTaxNumber) eulenPayload.endUserTaxNumber = endUserTaxNumber

      // Se split fee estiver configurado no servidor e aprovado contratualmente
      if (romSplitAddress && romSplitFeePercent) {
        eulenPayload.depixSplitAddress = romSplitAddress
        eulenPayload.splitFee = romSplitFeePercent
      }

      const eulenResp = $http.send({
        url: 'https://depix.eulen.app/api/deposit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eulenPayload),
        timeout: 15,
      })

      if (eulenResp.statusCode !== 200) {
        let errMessage = 'Erro na resposta da provedora Eulen'
        try {
          const errData = JSON.parse(eulenResp.raw)
          errMessage = errData.errorMessage || errData.error || errMessage
        } catch (_) {}
        return e.json(eulenResp.statusCode || 502, {
          error: 'EULEN_API_ERROR',
          message: errMessage,
        })
      }

      const eulenData = JSON.parse(eulenResp.raw)
      const eulenDeposit = eulenData.response || {}

      // Salvar a cobrança real associada ao comerciante no PocketBase
      const chargesCol = $app.findCollectionByNameOrId('charges')
      const chargeRec = new Record(chargesCol)

      chargeRec.set('user_id', userId)
      chargeRec.set('customer_name', customerName || endUserFullName || 'Cliente')
      chargeRec.set('amount_cents', amountCents)
      chargeRec.set('liquid_address', liquidAddress)
      chargeRec.set('description', description)
      chargeRec.set('status', 'pending')
      chargeRec.set('payment_method', 'real')
      chargeRec.set('is_simulated', false)
      chargeRec.set('eulen_deposit_id', eulenDeposit.id || '')
      chargeRec.set('pix_copia_cola', eulenDeposit.qrCopyPaste || '')
      chargeRec.set('qr_image_url', eulenDeposit.qrImageUrl || '')
      chargeRec.set('payment_link', `https://rom.app/pay/${eulenDeposit.id}`)
      chargeRec.set('idempotency_key', idempotencyKey)

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      chargeRec.set('expires_at', expiresAt)

      $app.save(chargeRec)

      return e.json(201, {
        charge: chargeRec,
        eulen_deposit_id: eulenDeposit.id,
        qrCopyPaste: eulenDeposit.qrCopyPaste,
        qrImageUrl: eulenDeposit.qrImageUrl,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro interno ao gerar cobrança' })
    }
  },
  $apis.requireAuth(),
)

/**
 * Webhook oficial para notificações da Eulen
 * Documentação: Authorization: Basic <secret>
 * Status recebidos: pending, under_review, approved, depix_sent, delayed, refunded, canceled, expired, error
 */
routerAdd('POST', '/backend/v1/eulen/webhook/deposit', (e) => {
  try {
    const webhookSecret = $os.getenv('EULEN_WEBHOOK_SECRET') || ''
    const authHeader = e.request.header.get('Authorization') || ''

    // Validar autenticação do webhook quando configurado
    if (webhookSecret) {
      const expectedHeader = `Basic ${webhookSecret}`
      if (authHeader !== expectedHeader) {
        return e.json(401, { error: 'UNAUTHORIZED_WEBHOOK' })
      }
    }

    const body = e.requestInfo().body || {}
    const qrId = body.qrId
    const status = body.status
    const bankTxId = body.bankTxId || ''
    const blockchainTxId = body.blockchainTxID || ''
    const payerName = body.payerName || ''
    const payerTaxNumber = body.payerTaxNumber || ''
    const payerEUID = body.payerEUID || ''
    const delayUntil = body.delayUntil || null

    if (!qrId) {
      return e.json(400, { error: 'MISSING_QR_ID' })
    }

    // Localizar a cobrança por eulen_deposit_id de forma idempotente
    let charge
    try {
      charge = $app.findFirstRecordByData('charges', 'eulen_deposit_id', qrId)
    } catch (_) {
      return e.json(200, { received: true, note: 'charge_not_found' })
    }

    // Processamento Idempotente:
    const currentStatus = charge.getString('status')
    if (currentStatus === 'depix_sent' && status !== 'refunded') {
      return e.json(200, { received: true, note: 'already_terminal_depix_sent' })
    }

    if (status) {
      charge.set('status', status)
    }

    if (bankTxId) {
      charge.set('bank_tx_id', bankTxId)
    }

    // "approved" = Pix confirmado e liberado pela conformidade
    if (status === 'approved' && !charge.getString('paid_at')) {
      charge.set('paid_at', new Date().toISOString())
    }

    // "depix_sent" = DePix enviado à carteira Liquid
    if (status === 'depix_sent') {
      if (blockchainTxId) {
        charge.set('blockchain_tx_id', blockchainTxId)
      }
      if (!charge.getString('depix_sent_at')) {
        charge.set('depix_sent_at', new Date().toISOString())
      }
      if (!charge.getString('paid_at')) {
        charge.set('paid_at', new Date().toISOString())
      }
    }

    if (payerName && !charge.getString('payer_name')) {
      charge.set('payer_name', payerName)
    }
    if (payerTaxNumber && !charge.getString('payer_tax_number')) {
      charge.set('payer_tax_number', payerTaxNumber)
    }
    if (payerEUID && !charge.getString('payer_euid')) {
      charge.set('payer_euid', payerEUID)
    }
    if (delayUntil) {
      charge.set('delay_until', delayUntil)
    }

    $app.save(charge)

    return e.json(200, {
      received: true,
      qrId,
      status,
      blockchainTxID: blockchainTxId,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar webhook' })
  }
})

/**
 * Consulta manual de status na Eulen: GET /deposit-status?id=...
 */
routerAdd(
  'GET',
  '/backend/v1/eulen/charges/{id}/sync',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')

      const chargeId = e.request.pathValue('id')
      const charge = $app.findRecordById('charges', chargeId)

      // Verificar autorização: apenas o dono ou admin
      const isOwner = charge.getString('user_id') === userId
      const isAdmin = Boolean(e.auth?.is_admin || e.auth?.get('role') === 'admin')
      if (!isOwner && !isAdmin) {
        return e.forbiddenError('Acesso negado a esta cobrança')
      }

      const eulenDepositId = charge.getString('eulen_deposit_id')
      if (!eulenDepositId) {
        return e.json(200, {
          charge,
          synced: false,
          reason: 'Cobrança não possui eulen_deposit_id',
        })
      }

      const clientId = $os.getenv('EULEN_CLIENT_ID') || ''
      const clientSecret = $os.getenv('EULEN_CLIENT_SECRET') || ''
      const legacyToken = $os.getenv('EULEN_API_TOKEN') || ''
      const isConfigured = Boolean((clientId && clientSecret) || legacyToken)

      if (!isConfigured) {
        return e.json(200, {
          charge,
          synced: false,
          reason: 'Credenciais Eulen não configuradas',
        })
      }

      let token = legacyToken
      if (!token && clientId && clientSecret) {
        const authResp = $http.send({
          url: 'https://depix.eulen.app/api/v2/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
          }),
          timeout: 10,
        })
        if (authResp.statusCode === 200) {
          const authData = JSON.parse(authResp.raw)
          token = authData.access_token
        }
      }

      if (!token) {
        return e.json(502, { error: 'Falha ao autenticar com a Eulen' })
      }

      const resp = $http.send({
        url: `https://depix.eulen.app/api/deposit-status?id=${eulenDepositId}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10,
      })

      if (resp.statusCode === 200) {
        const data = JSON.parse(resp.raw)
        const deposit = data.response || {}

        if (deposit.status) {
          charge.set('status', deposit.status)
        }
        if (deposit.bankTxId) {
          charge.set('bank_tx_id', deposit.bankTxId)
        }
        if (deposit.blockchainTxID) {
          charge.set('blockchain_tx_id', deposit.blockchainTxID)
        }
        if (deposit.payerName) {
          charge.set('payer_name', deposit.payerName)
        }
        if (deposit.payerTaxNumber) {
          charge.set('payer_tax_number', deposit.payerTaxNumber)
        }
        if (deposit.status === 'approved' && !charge.getString('paid_at')) {
          charge.set('paid_at', new Date().toISOString())
        }
        if (deposit.status === 'depix_sent' && !charge.getString('depix_sent_at')) {
          charge.set('depix_sent_at', new Date().toISOString())
        }

        $app.save(charge)
        return e.json(200, { charge, synced: true, remote: deposit })
      }

      return e.json(resp.statusCode, { error: 'Falha ao consultar status na Eulen' })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao sincronizar cobrança' })
    }
  },
  $apis.requireAuth(),
)

/**
 * Rotina Periódica (Cron Job) de Conciliação Eulen
 * Executa a cada 15 minutos para sincronizar cobranças reais pendentes
 */
cronAdd('reconcile_eulen_deposits', '*/15 * * * *', () => {
  try {
    const clientId = $os.getenv('EULEN_CLIENT_ID') || ''
    const clientSecret = $os.getenv('EULEN_CLIENT_SECRET') || ''
    const legacyToken = $os.getenv('EULEN_API_TOKEN') || ''
    const isConfigured = Boolean((clientId && clientSecret) || legacyToken)

    if (!isConfigured) return

    // Buscar até 30 cobranças reais pendentes
    const pendingCharges = $app.findRecordsByFilter(
      'charges',
      "is_simulated = false && (status = 'pending' || status = 'under_review' || status = 'delayed')",
      '-created',
      30,
      0,
    )

    if (pendingCharges.length === 0) return

    let token = legacyToken
    if (!token && clientId && clientSecret) {
      const authResp = $http.send({
        url: 'https://depix.eulen.app/api/v2/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        }),
        timeout: 10,
      })
      if (authResp.statusCode === 200) {
        const authData = JSON.parse(authResp.raw)
        token = authData.access_token
      }
    }

    if (!token) return

    for (let i = 0; i < pendingCharges.length; i++) {
      const charge = pendingCharges[i]
      const eulenId = charge.getString('eulen_deposit_id')
      if (!eulenId) continue

      try {
        const resp = $http.send({
          url: `https://depix.eulen.app/api/deposit-status?id=${eulenId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 8,
        })

        if (resp.statusCode === 200) {
          const data = JSON.parse(resp.raw)
          const deposit = data.response || {}

          if (deposit.status && deposit.status !== charge.getString('status')) {
            charge.set('status', deposit.status)
            if (deposit.bankTxId) charge.set('bank_tx_id', deposit.bankTxId)
            if (deposit.blockchainTxID) charge.set('blockchain_tx_id', deposit.blockchainTxID)
            if (deposit.status === 'approved' && !charge.getString('paid_at')) {
              charge.set('paid_at', new Date().toISOString())
            }
            if (deposit.status === 'depix_sent' && !charge.getString('depix_sent_at')) {
              charge.set('depix_sent_at', new Date().toISOString())
            }
            $app.save(charge)
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error('Erro no cron de reconciliação Eulen:', err)
  }
})
