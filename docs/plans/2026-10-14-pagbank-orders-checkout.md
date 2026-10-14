# ecr20ttk — checkout real no PagBank (Orders API) + validação de pagamento na conta do Liniker

> Plano de trabalho. Nada implementado ainda. Todo o contrato abaixo foi verificado ao vivo
> (não é leitura de doc): o cliente que vai ser portado já roda no gSimulados e foi testado
> no sandbox do PagBank em 14/10/2026 — boleto ✅ `201/WAITING`, cartão ✅ `201/PAID` e
> `201/DECLINED`, webhook ✅ (payload idêntico ao response síncrono), PIX ⛔
> (`400 Pix key was not found for payment method`). Repo: `github.com/linikers/erc20TokenLab`,
> deploy Vercel `ecr20ttk.vercel.app` (projeto `ecr20ttk`, team `linikers-projects`).

**Objetivo:** o aluno paga R$ 19,00 (PIX) e recebe acesso automaticamente, com o dinheiro
caindo **na conta PagBank PF do Liniker** — sem aprovação manual.

**Arquitetura:** Next.js App Router (rota de API por arquivo) falando direto com a **API de
Pedidos do PagBank** (`POST /orders`), com webhook HTTPS público (a Vercel já entrega isso) +
reconsulta `GET /orders/{id}` como fonte de verdade. Sem gateway intermediário, sem assinatura
(produto é compra única → não precisa da API de Assinaturas, que é restrita a PJ).

**Stack:** Next.js 16.2.4 / React 19 / Tailwind 4 / TypeScript. Nenhuma dependência nova
obrigatória (`fetch` nativo no lugar do axios do gSimulados).

---

## 1. Estado real hoje (medido, não suposto)

`POST https://ecr20ttk.vercel.app/api/create-checkout {"method":"pagbank"}` → **HTTP 500**.
Logs da Vercel do próprio request:

```
[PagBank] Credentials defined: true true Sandbox: true
Tentativa 1 (Bearer direto)     → 401 {"code":"UNAUTHORIZED","description":"Invalid credential. Review AUTHORIZATION header"}
Tentativa 2 (OAuth form)        → 415
Tentativa 3 (OAuth JSON)        → 400 {"code":"41001","description":"invalid_request","parameter_name":"code"}
Tentativa 4 (XML Checkout v2)   → 500
[PagBank] TODAS as tentativas falharam
```

Leitura: `PAGBANK_EMAIL` / `PAGBANK_TOKEN` / `PAGBANK_SANDBOX=true` **existem** na Vercel
(confirmado por `vercel env ls production`), mas o token **não é credencial da API de Pedidos**
— o PagBank responde `401 Invalid credential`. Os 415/400 das tentativas 2 e 3 mostram que o
endpoint de OAuth chamado não aceita `client_credentials` (é o fluxo por `code`), e a tentativa
4 usa o **Checkout v2 XML legado** (`ws.sandbox.pagseguro.uol.com.br`), produto descontinuado.

Além do token, o payload está errado para a API de Pedidos:

| Problema | Consequência |
|---|---|
| `POST /orders` **sem `charges[]`** e sem `payment_method` | não existe cobrança PIX/QR para o aluno pagar; a `redirect_url` montada na mão (`checkout/v2/payment/redirect.html?code=ORDE_...`) leva a um checkout que não foi criado |
| sem `customer.tax_id` | a API devolve `400 must not be null` (CPF é obrigatório; hoje o form só pede e-mail) |
| sem `notification_urls` na cobrança | nenhum webhook de confirmação |
| 4 estratégias de autenticação em sequência | mascara o erro real (o 401 vira "tentei tudo e falhou") |
| `purchases.json` como banco | Vercel é read-only: `src/data/purchases.json` está `[]` e **nada persiste** — nem o webhook, nem a aprovação do admin |

E o rótulo da tela não bate com o código: o botão **💳 Cartão** envia `method: "pagbank"`
(`page.tsx:236`) e o texto abaixo promete "PagBank • Pix, cartão de crédito ou boleto". Ou seja,
o botão que o aluno clica para pagar hoje devolve **500** — na prática o único meio que funciona é
o **📱 Pix estático** (chave aleatória + confirmação manual pelo admin).

O que **já funciona** e vai ser reaproveitado: páginas `/course`, `/admin`, `/approve`,
`/api/verify-access`, o tracking de afiliado (`?ref=`) e o PIX estático (fica como fallback).

---

## 2. Decisões

| Decisão | Por quê |
|---|---|
| **PIX primeiro** (cartão depois) | R$ 19,00: taxa percentual do PIX (~1%) perde menos que a do cartão; PIX liquida na hora e o QR vem no response |
| Não usar Checkout v3 / XML legado | descontinuado; o token do painel novo não autentica nele |
| Não usar API de Assinaturas | produto é compra única; e a API de Assinaturas é restrita a conta PJ (a conta é PF) |
| Webhook + `GET /orders/{id}` (polling) | o webhook confirma; o polling é a fonte de verdade e não depende de banco para liberar o acesso na hora |
| Sem `axios` | `fetch` nativo basta; zero dependência nova no repo |
| Manter o PIX estático | fallback se o PagBank recusar — não deixar a página sem meio de pagamento |

---

## 3. PRs

| PR | Tópico | Prioridade | Entrega |
|----|--------|-----------|---------|
| #1 | Cliente PagBank + checkout PIX + webhook + liberação por status | 🔴 P0 | Aluno paga por PIX real e o acesso libera sozinho |
| #2 | Persistência de vendas (Upstash Redis ou Neon) | 🟠 P1 | Lista de vendas real, admin e afiliado funcionando |
| #3 | Cartão de crédito + boleto + cupom | 🟡 P2 | Métodos extras (cartão depende de resposta do PagBank sobre criptografia) |

Branch: `pr-1-pagbank-checkout` a partir de `main` (hoje `4d4f0da`). PR → aprovação → merge →
deploy automático na Vercel.

---

## PR #1 — Cliente PagBank, checkout PIX, webhook e liberação automática

### Task 1 — Diagnóstico do token atual (10 min, antes de escrever código)

Provar qual credencial está na Vercel e o que ela serve. Não dá para ler o valor (secret), então
roda-se pelo próprio runtime da Vercel com um endpoint temporário protegido — ou, mais rápido,
local com o token que o Liniker colar em `.env.local`:

**Criar `frontend/src/app/api/pagbank/diagnostico/route.ts`** (temporário, remover no fim do PR):

```ts
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.PAGBANK_TOKEN?.trim();
  if (!token) return NextResponse.json({ ok: false, motivo: "PAGBANK_TOKEN ausente" });

  const baseUrl = process.env.PAGBANK_BASE_URL
    || (process.env.PAGBANK_SANDBOX === "true"
      ? "https://sandbox.api.pagseguro.com"
      : "https://api.pagseguro.com");

  // Um POST /orders mínimo (boleto do sandbox) responde 201 se o token é da API de Pedidos.
  const resposta = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference_id: `diag_${Date.now()}`,
      customer: { name: "Diagnostico", email: "diag@example.com", tax_id: "12345678909" },
      items: [{ name: "Teste", quantity: 1, unit_amount: 100 }],
      charges: [{
        reference_id: `diag_${Date.now()}`,
        amount: { value: 100, currency: "BRL" },
        payment_method: { type: "BOLETO" },
      }],
    }),
  });

  return NextResponse.json({
    baseUrl,
    http: resposta.status,
    corpo: await resposta.json().catch(() => null),
  });
}
```

Esperado: `401 Invalid credential` = o token não é da API de Pedidos (caso provável) →
**ação do Liniker**: gerar token novo (ver §5). `201` = token ok, seguir.

- [ ] `vercel logs` do dia confirma o 401 atual (já confirmado em 14/10)
- [ ] remover o endpoint de diagnóstico antes do merge

### Task 2 — `frontend/src/lib/pagbank.ts` (cliente portado do gSimulados)

Porta `apps/api/src/services/pagbank/pagbank-client.service.ts` (gSimulados, já validado ao
vivo) para `fetch`, **sem** axios e **sem** Mongoose. Mesmo contrato e mesmas regras.

```ts
// frontend/src/lib/pagbank.ts
export const PAGBANK_SANDBOX = "https://sandbox.api.pagseguro.com";
export const PAGBANK_PRODUCAO = "https://api.pagseguro.com";

export type StatusPagBank = "WAITING" | "IN_ANALYSIS" | "PAID" | "AVAILABLE"
  | "DECLINED" | "CANCELED" | "EXPIRED" | "REFUNDED" | string;

const MAPA: Record<string, "pendente" | "pago" | "recusado" | "cancelado" | "expirado"> = {
  WAITING: "pendente", IN_ANALYSIS: "pendente", PAID: "pago", AVAILABLE: "pago",
  DECLINED: "recusado", CANCELED: "cancelado", EXPIRED: "expirado", REFUNDED: "cancelado",
};

/** Status desconhecido NUNCA vira "pago" — senão libera acesso de graça. */
export const statusInterno = (s: StatusPagBank) => MAPA[String(s ?? "").toUpperCase()] ?? "pendente";

export interface PedidoNormalizado {
  pedidoId: string;
  chargeId?: string;
  status: ReturnType<typeof statusInterno>;
  statusBruto?: string;
  valorCentavos: number;
  referencia: string;
  qrCodeTexto?: string;
  qrCodePngUrl?: string;
  boletoBarcode?: string;
  boletoPdfUrl?: string;
  bruto: unknown;
}

export class PagBankErro extends Error {
  constructor(mensagem: string, readonly http?: number, readonly detalhes?: unknown) {
    super(mensagem);
  }
}

export function baseUrl() {
  return (process.env.PAGBANK_BASE_URL?.trim().replace(/\/+$/, "")) || PAGBANK_SANDBOX;
}
export const pagbankConfigurado = () => Boolean(process.env.PAGBANK_TOKEN?.trim());

function token() {
  const t = process.env.PAGBANK_TOKEN?.trim();
  if (!t) throw new PagBankErro("PAGBANK_TOKEN ausente (Vendas → Integrações no PagBank).");
  return t;
}

/** 5xx/rede repete; 401/403 e 4xx não (é token/payload, não rede). */
async function requisitar<T>(metodo: "GET" | "POST", caminho: string, corpo?: unknown): Promise<T> {
  const tentativas = Number(process.env.PAGBANK_TENTATIVAS || 2);
  let ultimo: { http?: number; corpo?: unknown } = {};

  for (let i = 1; i <= tentativas; i++) {
    const r = await fetch(`${baseUrl()}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store",
    });

    const dados = await r.json().catch(() => null);
    if (r.ok) return dados as T;

    ultimo = { http: r.status, corpo: dados };
    const detalhe = (dados as any)?.error_messages?.[0];
    const motivo = detalhe
      ? `${detalhe.parameter_name ? `${detalhe.parameter_name}: ` : ""}${detalhe.description ?? ""}`
      : "";

    if (r.status === 401 || r.status === 403) {
      throw new PagBankErro(
        "PagBank recusou o token (401/403). Sandbox usa o token do Portal do Desenvolvedor; produção usa Vendas → Integrações → Gerar Token.",
        r.status, dados);
    }
    if (/Pix key was not found/i.test(JSON.stringify(dados ?? ""))) {
      throw new PagBankErro(
        "A conta PagBank não tem chave PIX ativa. Cadastre uma chave PIX no app/site do PagBank antes de cobrar por PIX.",
        r.status, dados);
    }
    if (r.status < 500) {
      throw new PagBankErro(`PagBank recusou (${r.status})${motivo ? `: ${motivo}` : "."}`, r.status, dados);
    }
    if (i < tentativas) await new Promise((res) => setTimeout(res, 1000 * i));
  }
  throw new PagBankErro(`Falha ao falar com o PagBank${ultimo.http ? ` (${ultimo.http})` : ""}.`, ultimo.http, ultimo.corpo);
}

export function normalizar(resposta: any, referencia = ""): PedidoNormalizado {
  const cobranca = resposta?.charges?.[0] ?? {};
  const qr = resposta?.qr_code?.[0] ?? cobranca?.payment_method?.pix ?? {};
  const link = (rel: string) =>
    (qr?.links ?? cobranca?.links ?? []).find((l: any) => l?.rel === rel)?.href;

  return {
    pedidoId: resposta?.id ?? "",
    chargeId: cobranca?.id,
    status: statusInterno(cobranca?.status),
    statusBruto: cobranca?.status,
    valorCentavos: cobranca?.amount?.value ?? resposta?.amount?.value ?? 0,
    referencia: resposta?.reference_id ?? referencia,
    qrCodeTexto: qr?.text,
    qrCodePngUrl: link("QRCODE.PNG") ?? link("QRCODE.BASE64"),
    boletoBarcode: cobranca?.payment_method?.boleto?.barcode,
    boletoPdfUrl: link("BOLETO.PDF"),
    bruto: resposta,
  };
}

export interface CriarPedidoPixParams {
  referencia: string;              // nosso id da compra (liga o webhook ao nosso domínio)
  valorCentavos: number;
  descricao: string;
  cliente: { nome: string; email: string; taxId: string }; // tax_id é OBRIGATÓRIO
  notificationUrls: string[];
  expiracaoMinutos?: number;
}

export async function criarPedidoPix(p: CriarPedidoPixParams): Promise<PedidoNormalizado> {
  const taxId = String(p.cliente.taxId ?? "").replace(/\D/g, "");
  if (!/^\d{11}$|^\d{14}$/.test(taxId)) {
    throw new PagBankErro("CPF (11 dígitos) ou CNPJ (14) do comprador é obrigatório no PagBank.");
  }
  const minutos = p.expiracaoMinutos ?? 60;

  const corpo = {
    reference_id: p.referencia,
    customer: { name: p.cliente.nome, email: p.cliente.email, tax_id: taxId },
    items: [{ name: p.descricao, quantity: 1, unit_amount: p.valorCentavos }],
    charges: [{
      reference_id: p.referencia,
      description: p.descricao,
      amount: { value: p.valorCentavos, currency: "BRL" },
      payment_method: {
        type: "PIX",
        // a chave PIX NÃO vai no payload: a API usa a chave da conta recebedora
        pix: { expiration_date: new Date(Date.now() + minutos * 60_000).toISOString() },
      },
      notification_urls: p.notificationUrls,
    }],
  };

  return normalizar(await requisitar<any>("POST", "/orders", corpo), p.referencia);
}

export const consultarPedido = async (pedidoId: string) =>
  normalizar(await requisitar<any>("GET", `/orders/${encodeURIComponent(pedidoId)}`), "");

export const cancelarCobranca = async (chargeId: string) =>
  statusInterno((await requisitar<any>("POST", `/charges/${encodeURIComponent(chargeId)}/cancel`))?.status);
```

- [ ] `npx tsc --noEmit` limpo
- [ ] nenhuma dependência nova no `package.json`

### Task 3 — `POST /api/pagbank/checkout`

Cria a cobrança PIX e devolve o QR. Substitui o bloco `if (method === "pagbank")` do
`/api/create-checkout` (que hoje tenta 4 formas de autenticação e o XML legado — **remover tudo**).

```ts
// frontend/src/app/api/pagbank/checkout/route.ts
import { NextResponse } from "next/server";
import { criarPedidoPix, pagbankConfigurado, PagBankErro } from "@/lib/pagbank";

const PRECO_CENTAVOS = 1900; // R$ 19,00 — mesma constante da landing
const PRODUTO = "Curso: Do Zero ao seu Token ERC20";

export async function POST(request: Request) {
  const { email, name, taxId, ref } = await request.json();
  if (!email) return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
  if (!/^\d{11}$|^\d{14}$/.test(String(taxId ?? "").replace(/\D/g, ""))) {
    return NextResponse.json({ error: "CPF é obrigatório para gerar o PIX" }, { status: 400 });
  }
  if (!pagbankConfigurado()) {
    // sem token → cai no PIX estático (fallback), não estoura 500
    return NextResponse.json({ fallback: "pix_estatico", motivo: "PAGBANK_TOKEN ausente" }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://ecr20ttk.vercel.app";
  const referencia = `ERC20-${Date.now()}-${String(email).slice(0, 8)}`;

  try {
    const pedido = await criarPedidoPix({
      referencia,
      valorCentavos: PRECO_CENTAVOS,
      descricao: PRODUTO,
      cliente: { nome: name || "Cliente", email, taxId },
      notificationUrls: [`${baseUrl}/api/pagbank/webhook`],
      expiracaoMinutos: 60,
    });

    return NextResponse.json({
      method: "pagbank_pix",
      order_id: pedido.pedidoId,
      charge_id: pedido.chargeId,
      referencia,
      qr_code: pedido.qrCodeTexto,      // copia-e-cola
      qr_png: pedido.qrCodePngUrl,      // PNG/BASE64 do QR
      amount: PRECO_CENTAVOS / 100,
      status: pedido.statusBruto ?? "WAITING",
      ref: ref || "",
    });
  } catch (erro) {
    const e = erro as PagBankErro;
    return NextResponse.json({ error: e.message, http: e.http, detalhes: e.detalhes }, { status: 502 });
  }
}
```

### Task 4 — `POST /api/pagbank/webhook`

Idempotente e à prova de liberar acesso errado. Sem banco (PR #1), a idempotência é feita
**reconsultando o PagBank** — o webhook é gatilho, o `GET /orders/{id}` é a verdade.

```ts
// frontend/src/app/api/pagbank/webhook/route.ts
import { NextResponse } from "next/server";
import { consultarPedido } from "@/lib/pagbank";

const PRECO_CENTAVOS = 1900;

export async function POST(request: Request) {
  try {
    const body = await request.json();               // mesmo formato do response síncrono
    const cobranca = body?.charges?.[0] ?? {};
    const referencia: string = body?.reference_id ?? "";

    // 1) não confiar no payload: reconferir na API do PagBank
    const pedido = body?.id ? await consultarPedido(body.id) : null;
    if (!pedido) return NextResponse.json({ received: true });

    // 2) conferir o valor antes de liberar
    if (pedido.status === "pago" && pedido.valorCentavos !== PRECO_CENTAVOS) {
      console.warn("[pagbank webhook] valor divergente", { referencia, recebido: pedido.valorCentavos });
      return NextResponse.json({ received: true });
    }

    // 3) status desconhecido NÃO libera (statusInterno já devolve "pendente")
    // TODO PR#2: gravar/atualizar a compra (idempotente por `${chargeId}:${status}`)
    console.log("[pagbank webhook]", { referencia, charge: cobranca?.id, status: pedido.status });

    return NextResponse.json({ received: true });    // sempre 200: erro faz o PagBank reenviar
  } catch (erro) {
    console.error("webhook pagbank:", erro);
    return NextResponse.json({ received: true });
  }
}
```

### Task 5 — `GET /api/pagbank/status` (a fonte de verdade do acesso)

```ts
// frontend/src/app/api/pagbank/status/route.ts
import { NextResponse } from "next/server";
import { consultarPedido } from "@/lib/pagbank";

export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order");
  if (!order) return NextResponse.json({ error: "order é obrigatório" }, { status: 400 });
  const pedido = await consultarPedido(order);
  return NextResponse.json({
    order_id: pedido.pedidoId,
    status: pedido.statusBruto,
    liberado: pedido.status === "pago",
    valor: pedido.valorCentavos / 100,
  });
}
```

### Task 6 — Tela: CPF + QR real + liberação automática

Arquivos: `frontend/src/app/page.tsx` (checkout da landing) e `frontend/src/app/course/page.tsx`.

| Mudança | Detalhe |
|---|---|
| Campo **CPF** | obrigatório junto do e-mail (a API exige `customer.tax_id`); mesmo estilo dos outros inputs do checkout |
| Botão **Comprar Agora** com PagBank | passa a chamar `/api/pagbank/checkout` (não `/api/create-checkout`) |
| QR real | `qr_png` do PagBank (hoje usa `api.qrserver.com` a partir de um payload PIX estático) + `qr_code` no copia-e-cola |
| Auto-liberação | polling `GET /api/pagbank/status?order=...` a cada 5s; ao vir `liberado: true` → redireciona para `/course?order=<order_id>` |
| Estado de erro | se `/api/pagbank/checkout` devolver 502, mostrar o motivo cru do PagBank (o cliente já traduz 401/PIX sem chave) e oferecer o PIX estático como alternativa |
| Access guard | `verify-access?order=<ORDE_...>` aceita order id (status pago no PagBank) **além** do `purchase_id` atual |

Mockup antes de codar (regra do repo): captura da tela de checkout atual + a nova com CPF e QR,
nos 2 temas, para aprovação.

### Task 7 — Limpeza (mesmo PR)

- [ ] apagar do `/api/create-checkout` o bloco de 4 tentativas PagBank + XML legado + `PAGBANK_EMAIL`
- [ ] manter Bipa/BTC como estão — `method === "bipa"` aparece **duas vezes** no arquivo: se houver `BIPA_API_KEY` o primeiro bloco cria a invoice; sem a chave, o segundo devolve a invoice Lightning **estática** (o botão ₿ Bitcoin, que hoje cai nesse caminho). Só renomear os rótulos na UI (`💳 Cartão` → `💠 PagBank Pix`) para a tela não prometer cartão no PR #1
- [ ] `PAGBANK_SANDBOX` deixa de ser usado: só `PAGBANK_BASE_URL`
- [ ] `.env.example` com as chaves novas

### Verificação do PR #1

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run test && npm run build
# local: PAGBANK_TOKEN=<sandbox do portaldev> PAGBANK_BASE_URL=https://sandbox.api.pagseguro.com npm run dev
curl -s -X POST localhost:3000/api/pagbank/checkout -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","name":"Teste","taxId":"12345678909"}' | head -c 400
# esperado: 201 → {"method":"pagbank_pix","order_id":"ORDE_...","qr_code":"00020101..."}
# se vier 400 Pix key was not found → a conta do sandbox não tem chave PIX (limite do sandbox, não bug)
```

---

## PR #2 — Persistência de vendas (🟠 P1)

Sem isso, uma venda real não deixa registro no app (a Vercel não escreve arquivo) e o admin/
afiliado continuam vendo `[]`.

- [ ] Upstash Redis (Vercel → Storage, plano free) **ou** Neon Postgres — decidir na hora
- [ ] `${CHAR_ID}:${STATUS}` como chave de idempotência no webhook (nunca liberar 2×)
- [ ] trocar `purchases.json` em `/api/purchases`, `/api/admin/approve`, `/api/verify-access`, `/api/create-checkout`
- [ ] `referred_by` passa a persistir de verdade (hoje o afiliado só grava no arquivo read-only)

## PR #3 — Cartão, boleto e cupom (🟡 P2)

- [ ] boleto: exige `holder.address` **completo** (`region` **e** `region_code`) — validado ao vivo
- [ ] cartão: `installments`, `capture: true`, `soft_descriptor` e `card{number,exp_month,exp_year,security_code,holder{name,tax_id}}` **dentro de `payment_method`** (mandar `soft_descriptor` em `seller` → `400 ...must not be empty`)
- [ ] **antes de codar cartão**: perguntar ao time de integrações se produção exige `card.encrypted` (chave pública) para quem não é PCI — dado de cartão em texto no backend é problema de PCI, não de código
- [ ] cupom avulso (hoje o desconto é só por escola, no outro repo)

---

## 4. Riscos

| # | Risco | Nível | Mitigação |
|---|-------|-------|-----------|
| 1 | Token de produção só o Liniker gera (login no PagBank) | 🔴 | roteiro §5; nada em produção sem ele — o fallback PIX estático continua no ar |
| 2 | Conta sem chave PIX ativa → `400 Pix key was not found` (foi o que bloqueou o sandbox) | 🔴 | conferir chave PIX na conta **antes** de codar a tela |
| 3 | Sem PR #2, venda não fica registrada no app | 🟡 | validar por PagBank (extrato) + `/api/pagbank/status`; PR #2 logo em seguida |
| 4 | Webhook reenviado libera acesso 2× | 🟡 | idempotência por `charge:status` (PR #1 já reconsulta a API antes de liberar) |
| 5 | Produção da API de Pedidos exigir liberação do time de Integrações em conta PF | 🟡 | perguntar junto com o token; se travar, o PIX estático segura a venda |
| 6 | Next.js 16 tem breaking changes vs. o que se sabe de cor | 🟢 | ler `frontend/node_modules/next/dist/docs/` antes de escrever as rotas (regra do `AGENTS.md`) |

---

## 5. Roteiro de validação do pagamento na conta PagBank do Liniker (a parte que só ele faz)

1. **Chave PIX ativa** — app/site PagBank → Pix → cadastrar chave (se não houver). *Sem isso o PIX não é criado.*
2. **Token de produção** — desktop PagBank → **Vendas → Integrações → Gerar Token**. (Sandbox, se quiser testar antes: `portaldev.pagbank.com.br` → aba **Tokens**.)
3. **Testar o token por curl** (boleto primeiro: é o meio mais simples de validar a integração inteira):
   ```bash
   curl -s -X POST "https://api.pagseguro.com/orders" \
     -H "Authorization: Bearer $PAGBANK_TOKEN" -H "Content-Type: application/json" -d '{
     "reference_id":"TESTE-1","customer":{"name":"Liniker","email":"kurumin8@hotmail.com","tax_id":"<CPF dele>"},
     "items":[{"name":"Teste","quantity":1,"unit_amount":1900}],
     "charges":[{"reference_id":"TESTE-1","amount":{"value":1900,"currency":"BRL"},
       "payment_method":{"type":"BOLETO","boleto":{"due_date":"2026-10-20",
         "holder":{"name":"Liniker","tax_id":"<CPF>","email":"kurumin8@hotmail.com",
           "address":{"street":"Rua X","number":"1","locality":"Centro","city":"Maringa","region":"PR","region_code":"PR","postal_code":"87000000","country":"BRA"}}}}]}'
   ```
   esperado `201` + `charges[0].status = WAITING` (com PIX no lugar de BOLETO: `201` + `qr_code[0].text`).
4. **Env na Vercel** (`vercel env add`, production): `PAGBANK_TOKEN`, `PAGBANK_BASE_URL=https://api.pagseguro.com`, `PAGBANK_SOFT_DESCRIPTOR=ERC20LAB`, `NEXT_PUBLIC_URL=https://ecr20ttk.vercel.app`. Redeploy.
5. **Cobrança real de R$ 19,00** pela própria tela do curso, paga por ele (PIX da conta dele) → conferir no extrato/conta PagBank que o valor entrou.
6. **Webhook**: `vercel logs https://ecr20ttk.vercel.app` mostrando o POST em `/api/pagbank/webhook`; e `curl "…/api/pagbank/status?order=ORDE_..."` → `{"status":"PAID","liberado":true}`.
7. **Acesso**: `/course?order=ORDE_...` abre o curso sem senha; testar em outra conta/e-mail.
8. **Limpar o teste**: `POST /orders/{id}/charges/{chargeId}/cancel` (devolve o valor) — ou deixar como primeira venda real.

### Definição de pronto do PR #1

- [ ] R$ 19,00 pagos por PIX caindo na conta PagBank do Liniker (com o `order_id` registrado)
- [ ] webhook recebido em HTTPS público, com valor conferido e sem liberar duas vezes
- [ ] `/course` aberto automaticamente após o pagamento, sem admin aprovando
- [ ] nenhum dado de cartão trafegando em texto (PR #1 nem tem cartão)
- [ ] `tsc`, lint, testes e build passando **local** antes do push
