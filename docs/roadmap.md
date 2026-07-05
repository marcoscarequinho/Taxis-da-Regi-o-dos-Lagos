# Roadmap — Taxis da Região dos Lagos

## MVP (Fase 1 — entregue nesta fase de desenvolvimento)

- Cadastro/login (e-mail + senha, JWT access/refresh)
- App único com dois modos (passageiro/motorista)
- Busca de destino com autocomplete (Google Places) e cálculo de rota (Google Directions)
- Solicitação de corrida, matching por proximidade (Redis GEO) com oferta sequencial ao motorista mais próximo
- Rastreamento ao vivo do motorista via WebSocket (Socket.io)
- Ciclo de status completo: `SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`
- Pagamento via Pix com **split automático** (Mercado Pago `disbursements`): 80% motorista / 20% plataforma, na hora
- Conexão da conta Mercado Pago do motorista via OAuth (necessária para receber o repasse)
- Avaliação mútua (passageiro ↔ motorista)
- Histórico de corridas e painel de ganhos do motorista
- Cadastro de motorista (CNH, veículo)

## V1

- Chat de texto in-app entre passageiro e motorista durante a corrida
- Painel administrativo web: gestão de usuários, monitoramento de corridas em tempo real, relatórios financeiros (comissão retida, repasses via split, corridas canceladas/concluídas, tempo médio)
- Geofencing (áreas de atuação) e base para tarifas dinâmicas por região
- Fallback de GPS impreciso (uso de sinal de rede/wifi como apoio ao `expo-location`)
- Retry/observabilidade do fluxo de matching (fila de fallback se nenhum motorista aceitar)
- Testes automatizados: E2E mobile (Detox) e E2E backend (Supertest), CI/CD (GitHub Actions)
- Verificação de antecedentes do motorista integrada (hoje é um campo manual `backgroundCheckStatus`)
- Deep link de retorno automático ao app após conectar o Mercado Pago (hoje o motorista volta manualmente)

## V2

- Surge pricing dinâmico (tarifa variável por demanda/geofence)
- Categorias de veículo (economy/conforto/etc.)
- Corridas agendadas
- Compartilhar trajeto com contatos (segurança)
- Múltiplas cidades/regiões com configuração de tarifa por região
- Métricas avançadas e detecção de fraude (corridas simuladas, GPS spoofing)
- Programa de indicação/cupons

## Fora de escopo por decisão do negócio (não apenas adiado)

- Pagamento em cartão e dinheiro: descartados deliberadamente — o modelo de negócio depende do split automático via Pix/Mercado Pago, que não se aplica a cartão (exigiria fluxo de tokenização + `application_fee`) nem dinheiro (sem como garantir o repasse de 20% à plataforma).
