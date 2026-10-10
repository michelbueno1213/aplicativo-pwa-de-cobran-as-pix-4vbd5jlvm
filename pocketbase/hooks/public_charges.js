/**
 * Endpoint público somente leitura para consulta de cobrança (/backend/v1/public/charges/{id})
 * Permite renderizar a página pública de pagamento sem exigir login.
 * Retorna estritamente dados não sensíveis:
 * - id
 * - amount_cents
 * - description
 * - status
 * - is_simulated
 * - pix_copia_cola (se houver)
 * - qr_image_url (se houver)
 * - expires_at
 * - merchant_name (nome público do comerciante ou fantasia)
 */
routerAdd('GET', '/backend/v1/public/charges/{id}', (e) => {
  try {
    const chargeId = e.request.pathValue('id')
    if (!chargeId) {
      return e.json(400, { error: 'ID da cobrança ausente' })
    }

    let charge
    try {
      charge = $app.findRecordById('charges', chargeId)
    } catch (_) {
      return e.json(404, { error: 'Cobrança não encontrada.' })
    }

    // Buscar nome público do comerciante (apenas o nome, sem e-mail ou dados sensíveis)
    let merchantName = 'Comerciante ROM'
    try {
      const userId = charge.getString('user_id')
      if (userId) {
        const userRec = $app.findRecordById('users', userId)
        if (userRec) {
          merchantName = userRec.getString('name') || 'Comerciante ROM'
        }
      }
    } catch (_) {}

    return e.json(200, {
      id: charge.id,
      amount_cents: charge.getInt('amount_cents'),
      description: charge.getString('description') || '',
      status: charge.getString('status') || 'pending',
      is_simulated: charge.getBool('is_simulated'),
      pix_copia_cola: charge.getString('pix_copia_cola') || '',
      qr_image_url: charge.getString('qr_image_url') || '',
      expires_at: charge.getString('expires_at') || '',
      created: charge.getString('created') || '',
      merchant_name: merchantName,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao consultar cobrança' })
  }
})
