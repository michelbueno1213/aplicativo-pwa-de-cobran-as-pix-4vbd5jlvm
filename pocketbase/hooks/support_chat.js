routerAdd(
  'POST',
  '/backend/v1/support/chat',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.unauthorizedError('Autenticação necessária')
      }

      const body = e.requestInfo().body || {}
      const message = body.message
      if (!message || typeof message !== 'string' || !message.trim()) {
        return e.badRequestError('Mensagem é obrigatória')
      }

      const conv = $ai.agent('suporte-skip').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
        title: body.title || 'Conversa de Suporte',
      })

      const stream = body.stream !== false
      if (stream) {
        const iter = $ai.agent('suporte-skip').chat({
          user_id: userId,
          conversation_id: conv.id,
          message: message.trim(),
          stream: true,
        })

        e.response.header().set('Content-Type', 'text/event-stream')
        e.response.header().set('Cache-Control', 'no-cache')
        e.response.header().set('X-Conversation-Id', conv.id)
        return $response.stream(e, iter)
      } else {
        const result = $ai.agent('suporte-skip').chat({
          user_id: userId,
          conversation_id: conv.id,
          message: message.trim(),
          stream: false,
        })

        return e.json(200, {
          conversation_id: conv.id,
          content: result.content,
          citations: result.citations,
          message_id: result.message_id,
        })
      }
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha na requisição do assistente' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Assistente temporariamente indisponível' : err.message,
        })
      }
      return e.json(500, { error: err.message || 'Erro interno ao processar chat' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/support/conversations',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const limit = parseInt(e.requestInfo().query?.limit || '20', 10) || 20
      return e.json(200, $ai.agent('suporte-skip').listConversations({ user_id: userId, limit }))
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao listar conversas' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/support/conversations/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const convId = e.request.pathValue('conversationId')
      return e.json(
        200,
        $ai.agent('suporte-skip').listMessages({
          conversation_id: convId,
          user_id: userId,
        }),
      )
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Falha ao buscar mensagens' : err.message })
      }
      return e.json(500, { error: err.message || 'Erro interno' })
    }
  },
  $apis.requireAuth(),
)
