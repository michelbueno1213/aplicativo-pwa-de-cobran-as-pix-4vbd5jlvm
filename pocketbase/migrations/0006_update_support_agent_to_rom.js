/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Definir/atualizar o agente oficial para "Suporte ROM" (slug suporte-rom)
    $ai.agents.define(app, {
      slug: 'suporte-rom',
      name: 'Suporte ROM',
      description:
        'Assistente de suporte da plataforma ROM, focado em dúvidas sobre a plataforma, cobranças Pix, modo simulado e integrações futuras com DePix e Liquid.',
      systemPrompt:
        'Você é o assistente oficial de Suporte ROM para o aplicativo PWA de Cobranças Pix. Seu tom é profissional, acolhedor, elegante e direto. Você ajuda os usuários a entenderem como gerar cobranças Pix, o funcionamento do Modo Simulado (as cobranças atuais não processam dinheiro real até que a provedora seja integrada), a futura integração com carteira Liquid e DePix, gerenciamento de clientes e boas práticas da plataforma ROM. Responda em Português do Brasil de forma clara e objetiva.',
      tier: 'fast',
      memory: [
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Como funciona o modo simulado no ROM?',
                answer:
                  'No modo simulado da plataforma ROM, você pode gerar cobranças Pix com links e QR codes simulados para testar o fluxo de clientes sem movimentação financeira real. Assim que a parceria com a provedora Pix for aprovada, será possível ativar o modo real e receber DePix na carteira Liquid.',
              },
              {
                question: 'O que é DePix e carteira Liquid?',
                answer:
                  'DePix é a representação de Pix na rede Liquid Network, permitindo liquidações diretas em carteiras autocustodiais ou integradas. Essa funcionalidade estará disponível na próxima versão do aplicativo ROM.',
              },
              {
                question: 'Como convidar novos membros para o ROM?',
                answer:
                  'Como o acesso à plataforma ROM é exclusivo por convite, usuários autenticados podem gerar novos convites e cadastrar colaboradores na seção de Configurações.',
              },
            ],
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'suporte-rom')
    } catch (_) {}
  },
)
