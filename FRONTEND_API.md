# Apex Keys API — Guia para o frontend

Documento de referência para integração do cliente (web/mobile) com a API REST. A especificação canónica interactiva continua disponível em **`/docs`** (Swagger UI) e **`/redoc`** quando o servidor está em execução.

---

## Base URL

| Ambiente | Exemplo |
|----------|---------|
| Local (este repositório) | `http://127.0.0.1:8000` |
| Produção | Definir conforme deploy (ex.: `https://api.seudominio.com`) |

Todas as rotas listadas abaixo são relativas à base (sem barra final obrigatória).

---

## Convenções gerais

### `Content-Type`

- Pedidos com corpo: `application/json`.

### Autenticação JWT

Rotas marcadas como **Autenticado** exigem cabeçalho:

```http
Authorization: Bearer <access_token>
```

O token é obtido em `POST /auth/login`. Armazene-o de forma segura (memória, `sessionStorage` ou cookie httpOnly, conforme a arquitectura).

- **401** — Token ausente, inválido ou expirado.  
- **403** — Token válido mas sem permissão (ex.: rota só **admin**).

### Formato de erros

| Situação | HTTP | Corpo (resumo) |
|----------|------|----------------|
| Regra de negócio / recurso | 400, 402, 404, 409 | `{ "detail": "mensagem em texto" }` |
| Não autorizado | 401 | `{ "detail": "..." }` + `WWW-Authenticate: Bearer` quando aplicável |
| Proibido | 403 | `{ "detail": "..." }` |
| Validação Pydantic | 422 | `{ "detail": "Dados de entrada inválidos", "errors": [ ... ] }` |
| Erro interno | 500 | `{ "detail": "Erro interno. Tente novamente mais tarde." }` |

Não assuma stack traces ou campos internos na resposta de erro.

### Tipos e JSON

- **`UUID`**: string no formato canónico (ex.: `"550e8400-e29b-41d4-a716-446655440000"`).
- **`Decimal` / dinheiro**: na API aparecem como **string decimal** nos JSON de resposta (ex.: `"19.90"`) para precisão; envie números ou strings aceites pelo parser JSON no corpo dos pedidos conforme o schema.
- **`datetime`**: ISO 8601 (ex.: `"2026-03-21T12:00:00"` — formato exacto depende do serializador do servidor).

### CORS

O servidor só aceita origens listadas na variável de ambiente `CORS_ORIGINS` (separadas por vírgula). Para desenvolvimento local, inclua por exemplo `http://localhost:3000` ou a origem do seu dev server.

---

## Endpoints

### Health

#### `GET /health`

**Autenticação:** não.

**Resposta `200`:**

```json
{ "status": "ok" }
```

---

### Autenticação

#### `POST /auth/register`

**Autenticação:** não.

**Corpo:**

| Campo | Tipo | Regras |
|-------|------|--------|
| `name` | string | 1–255 caracteres |
| `email` | string | E-mail válido |
| `password` | string | 8–128 caracteres |
| `whatsapp` | string | 10–20 caracteres, apenas dígitos opcional `+` no início (regex: `^\+?[0-9]{10,20}$`) |

**Resposta `201`:** objeto **UserPublic** (ver modelo abaixo).

**Erros comuns:** `409` — e-mail ou WhatsApp já cadastrados.

---

#### `POST /auth/login`

**Autenticação:** não.

**Corpo:**

| Campo | Tipo |
|-------|------|
| `email` | string |
| `password` | string |

**Resposta `200`:**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

**Erros comuns:** `401` — credenciais inválidas.

---

#### `GET /auth/me`

**Autenticação:** utilizador (JWT).

**Resposta `200`:** **UserPublic**.

**Erros comuns:** `404` — utilizador não encontrado.

---

### Carteira

#### `GET /wallet/balance`

**Autenticação:** utilizador.

**Resposta `200`:**

```json
{
  "wallet_balance": "0.00"
}
```

---

#### `GET /wallet/transactions`

**Autenticação:** utilizador.

**Resposta `200`:** array de **TransactionOut** (máximo **200** registos, mais recentes primeiro).

---

#### `POST /wallet/mock-pix-intent`

**Autenticação:** utilizador.

> Uso previsto para **desenvolvimento / testes**: cria um depósito Pix pendente para simular o fluxo antes do gateway real.

**Corpo:**

| Campo | Tipo | Regras |
|-------|------|--------|
| `amount` | decimal | &gt; 0 |
| `gateway_reference` | string | 1–255 caracteres, **único** no sistema |

**Resposta `201`:** objecto com `message` e `mock_pix` (payload fictício para UI de teste).

**Erros comuns:** `409` — `gateway_reference` já utilizado.

---

### Sorteios e compras

#### `GET /raffles`

**Autenticação:** não.

**Query opcional:** `status` — um de `open`, `closed`, `canceled`. Se omitido, lista todos (até 100).

**Resposta `200`:** array de **RafflePublic**.

**Erros comuns:** `400` — valor de `status` inválido.

---

#### `POST /buy-ticket`

**Autenticação:** utilizador.

**Corpo:**

| Campo | Tipo | Regras |
|-------|------|--------|
| `raffle_id` | UUID | ID da rifa |
| `ticket_number` | inteiro | ≥ 1 e ≤ `total_numbers` da rifa |

**Resposta `200`:** **TicketPurchaseResponse**.

**Erros comuns:**

| HTTP | Significado |
|------|-------------|
| `400` | Rifa fechada/cancelada ou número fora do intervalo |
| `402` | Saldo insuficiente |
| `404` | Rifa ou utilizador não encontrado |
| `409` | Número já vendido ou conflito de concorrência |

---

#### `POST /admin/raffles/{raffle_id}/cancel`

**Autenticação:** **admin** (JWT com utilizador cuja coluna `role` na base é `admin`).

**Path:** `raffle_id` — UUID da rifa.

**Corpo:** vazio.

**Resposta `200`:** **RaffleCancelResponse** (`status` sempre `"canceled"`, `refunds_issued` = quantidade de estornos processados).

**Erros comuns:**

| HTTP | Significado |
|------|-------------|
| `403` | Não é administrador |
| `400` | Rifa não está `open` ou não pode ser cancelada |
| `404` | Rifa não existe |

---

### Webhook (gateway de pagamento)

#### `POST /webhook/mp`

**Autenticação:** não (em produção deve ser protegido por assinatura, IP, segredo, etc.).

> Implementação actual: **mock** estilo Mercado Pago. O frontend **não** deve chamar este endpoint em produção; quem chama é o **servidor do gateway**.

**Corpo:**

| Campo | Tipo | Valores |
|-------|------|---------|
| `gateway_reference` | string | Deve coincidir com uma transação `pix_deposit` pendente |
| `status` | string | Opcional; default `"approved"`. Valores aceites: `approved`, `pending`, `rejected`, `cancelled` (case-insensitive no processamento) |

**Resposta `200`:** **WebhookProcessResponse** quando o pagamento é aprovado e creditado, ou quando a transação já estava `completed` (resposta idempotente com saldo actual).

**Erros comuns:**

| HTTP | Significado |
|------|-------------|
| `404` | Nenhuma transação com esse `gateway_reference` |
| `400` | Status não aprovado (transação marcada como `failed`) |
| `409` | Transação já estava em estado `failed` |

---

## Modelos de dados (contratos)

### UserPublic

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | |
| `name` | string | |
| `email` | string | |
| `whatsapp` | string | |
| `role` | `"user"` \| `"admin"` | |
| `wallet_balance` | string (decimal) | |
| `created_at` | string (datetime) | |

---

### TransactionOut

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | |
| `amount` | string (decimal) | |
| `type` | string | `pix_deposit`, `purchase`, `refund`, `admin_adjustment` |
| `status` | string | `pending`, `completed`, `failed` |
| `gateway_reference` | string \| null | |
| `description` | string \| null | |
| `created_at` | string (datetime) | |

---

### RafflePublic

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | |
| `title` | string | |
| `total_numbers` | number (int) | |
| `price_per_number` | string (decimal) | |
| `status` | string | `open`, `closed`, `canceled` |
| `winner_ticket_id` | UUID \| null | |
| `created_at` | string (datetime) | |

---

### TicketPurchaseResponse

| Campo | Tipo |
|-------|------|
| `ticket_id` | UUID |
| `raffle_id` | UUID |
| `ticket_number` | number (int) |
| `amount_charged` | string (decimal) |
| `new_wallet_balance` | string (decimal) |

---

### RaffleCancelResponse

| Campo | Tipo |
|-------|------|
| `raffle_id` | UUID |
| `status` | `"canceled"` |
| `refunds_issued` | number (int) |

---

### WebhookProcessResponse

| Campo | Tipo |
|-------|------|
| `transaction_id` | UUID |
| `user_id` | UUID |
| `amount_credited` | string (decimal) |
| `new_wallet_balance` | string (decimal) |

---

## Fluxos sugeridos na UI

1. **Registo / login** → guardar `access_token` → `GET /auth/me` para estado inicial do utilizador e saldo.  
2. **Listar rifas** → `GET /raffles?status=open` → mostrar preço e gama de números (`1` … `total_numbers`).  
3. **Comprar número** → confirmar saldo (`wallet_balance` ≥ `price_per_number`) → `POST /buy-ticket` → actualizar saldo com `new_wallet_balance` ou refrescar `/wallet/balance`.  
4. **Histórico** → `GET /wallet/transactions` para extrato.  
5. **Depósito (dev)** → `POST /wallet/mock-pix-intent` → simular webhook com `POST /webhook/mp` (ferramenta tipo Postman ou script), não pelo browser se CORS não permitir.

---

## OpenAPI

Gere clientes tipados (TypeScript, etc.) a partir do schema OpenAPI:

- JSON: `GET /openapi.json`  
- UI: `GET /docs`

---

*Última revisão alinhada ao código da aplicação FastAPI em `app/`.*
