import type { ReactNode } from "react";
import type { Modulo } from "./frontend-web3";

const Codigo = ({ children }: { children: string }) => (
  <pre className="bg-neutral-950 border border-white/10 rounded-lg p-4 text-xs overflow-x-auto">
    <code className="text-emerald-300 font-mono whitespace-pre">{children}</code>
  </pre>
);

const Bloco = ({ children }: { children: ReactNode }) => (
  <div className="bg-orange-950/30 border border-orange-900/50 rounded-lg p-4 text-sm">
    {children}
  </div>
);

export const MODULOS_PIX_BITCOIN: Modulo[] = [
  {
    id: 1,
    title: "Por que receber em Pix e Bitcoin",
    subtitle: "Custo, liquidação e o que muda no caixa",
    minutes: 20,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">1.1 — a conta que ninguém faz</h3>
          <p className="leading-relaxed">
            Cartão de crédito custa entre 3% e 5% por venda (mais antecipação, se você quiser o
            dinheiro na hora). Pix custa zero na maioria das contas PJ e cai na hora. Bitcoin
            on-chain custa a taxa da rede (variável, em satoshi) e Lightning custa frações de
            centavo. Em ticket baixo — como um curso de R$ 19 — a diferença decide se a venda dá
            lucro.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-neutral-900/60 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-blue-300 mb-1">Cartão</h4>
              <p className="text-xs text-neutral-300">3–5% + prazo. Chargeback existe.</p>
            </div>
            <div className="bg-neutral-900/60 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-emerald-300 mb-1">Pix</h4>
              <p className="text-xs text-neutral-300">~0%. Na hora. Irreversível.</p>
            </div>
            <div className="bg-neutral-900/60 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-orange-300 mb-1">Bitcoin</h4>
              <p className="text-xs text-neutral-300">Taxa de rede. Global. Irreversível.</p>
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">1.2 — quem paga em cripto</h3>
          <p className="leading-relaxed">
            É público pequeno, mas é público que <strong>não consegue pagar de outro jeito</strong>{" "}
            (sem cartão internacional, sem conta em banco brasileiro) e público que simplesmente
            prefere. Para quem vende curso digital, os dois casos valem: você não perde a venda por
            falta de meio de pagamento.
          </p>
          <Bloco>
            <strong className="text-orange-300">Atenção:</strong> cripto não tem estorno. Toda
            venda é final — o que muda o desenho da sua política de reembolso. Escreva a regra
            antes de vender.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 2,
    title: "BR Code na mão",
    subtitle: "EMV, TLV e CRC16 sem biblioteca",
    minutes: 36,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">2.1 — a estrutura do Pix copia-e-cola</h3>
          <p className="leading-relaxed">
            O “copia-e-cola” é um payload EMV: uma sequência de campos{" "}
            <strong>ID + tamanho + valor</strong> (TLV). O ID é sempre 2 dígitos e o tamanho também.
            Gerar na mão é mais confiável do que parece — e você entende cada byte.
          </p>
          <Codigo>{`00 02 "01"                          // versão do payload
26 ... "BR.GOV.BCB.PIX" + chave      // conta do recebedor
52 04 "0000"                         // categoria
53 03 "986"                          // moeda BRL
54 05 "19.00"                        // valor
58 02 "BR"
59 ... "NOME DO RECEBEDOR"
60 ... "CIDADE"
62 ... "05" + "16" + txid            // identificador
63 04 CRC16                          // assinatura`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">2.2 — CRC16 e prova por teste</h3>
          <p className="leading-relaxed">
            O campo 63 é o CRC16/CCITT-FALSE calculado sobre <em>todo</em> o payload, incluindo{" "}
            <code>6304</code>. Errar isso faz o app do banco recusar o código. A forma de garantir
            que está certo não é olhar: é comparar com um payload de referência gerado por outra
            implementação, em teste automatizado.
          </p>
          <Codigo>{`function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// no teste: o payload inteiro precisa bater byte a byte
expect(gerarPixEstatico(params)).toBe(REFERENCIA);`}</Codigo>
          <Bloco>
            <strong className="text-orange-300">Por que testar assim:</strong> se o CRC mudar por
            acidente (ordem de campo, tamanho errado, acento no nome), o teste quebra antes do
            cliente abrir o app do banco e não conseguir pagar.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 3,
    title: "Pix automático por API",
    subtitle: "Cobrança, QR dinâmico e status",
    minutes: 38,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">3.1 — criar a cobrança</h3>
          <p className="leading-relaxed">
            Pix estático obriga você a conferir o comprovante na mão. Cobrança por API devolve um{" "}
            <strong>id de pedido</strong> que você consulta depois — e é isso que permite liberar
            acesso sozinho. Duas regras de sobrevivência: chave de idempotência em toda criação e{" "}
            <em>nunca</em> confiar no corpo do webhook.
          </p>
          <Codigo>{`POST /v1/orders
X-Idempotency-Key: <referencia do pedido>
{
  "type": "online",
  "total_amount": "19.00",
  "external_reference": "FWB3-1730000000-fulano@x.com",
  "transactions": [{
    "payments": [{
      "amount": "19.00",
      "payment_method": { "id": "pix", "type": "bank_transfer" }
    }]
  }]
}`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">3.2 — a verdade está no GET</h3>
          <p className="leading-relaxed">
            O webhook é só um aviso de que algo mudou. Quem diz se pagou é{" "}
            <code>GET /v1/orders/{"{id}"}</code>. Status desconhecido nunca libera acesso — e o
            webhook precisa responder 200 mesmo quando falha, senão o provedor reenvia em loop.
          </p>
          <Codigo>{`// no webhook: consulte, não confie no corpo
const pedido = await requisitar("GET", \`/v1/orders/\${id}\`);

// no front, a tela de acesso faz a mesma consulta:
GET /api/verify-access?mp=ORD...

// regra: só "pago" libera; todo o resto é pendente
`}</Codigo>
          <Bloco>
            <strong className="text-orange-300">Pitfall real:</strong> o <code>data.id</code> da
            notificação nem sempre é o id da ordem — em notificação de pagamento vem o id do
            pagamento. O handler precisa tentar os dois caminhos e confirmar no recurso canônico.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 4,
    title: "Bitcoin: on-chain e Lightning",
    subtitle: "Invoice, BIP21 e confirmação",
    minutes: 34,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">4.1 — Lightning para ticket baixo</h3>
          <p className="leading-relaxed">
            Em R$ 19, a taxa on-chain pode comer parte da venda. Lightning resolve isso: a invoice
            é gerada com valor fixo, expira em minutos e a liquidação é instantânea. Mas exige
            nó/carteira com canais — não é um endereço qualquer.
          </p>
          <Codigo>{`# invoice Lightning (valor fixo, expira)
lnbc190n1p...   # 190n = 0.19 micro-BTC (exemplo)

# BIP21 para QR que abre qualquer carteira:
bitcoin:bc1q...?amount=0&lightning=lnbc190n1p...`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">4.2 — confirmação on-chain</h3>
          <p className="leading-relaxed">
            On-chain não é instantâneo: mempool, taxa, bloco. Se você liberar acesso com zero
            confirmações, aceita risco de substituição (RBF). O caminho honesto é liberar só após
            a transação aparecer e informar o prazo ao comprador.
          </p>
          <Codigo>{`# consultar uma transação
curl https://mempool.space/api/tx/<txid>/status
{ "confirmed": true, "block_height": 850000 }

# antes de liberar: confira valor, endereço de destino e confirmação
`}</Codigo>
          <Bloco>
            <strong className="text-orange-300">Regra:</strong> endereço de recebimento é fixo e
            público. Invoice, não. Nunca reaproveite a mesma invoice para duas vendas — o valor
            não bate e a conciliação vira adivinhação.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 5,
    title: "Liberando acesso com segurança",
    subtitle: "Valor, produto e idempotência",
    minutes: 37,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">5.1 — três travas antes de liberar</h3>
          <p className="leading-relaxed">
            Webhook aberto é porta de graça. Três checagens separam venda de invasão:{" "}
            <strong>(1)</strong> o valor pago pertence ao catálogo, <strong>(2)</strong> a
            referência diz <em>qual</em> produto foi comprado, <strong>(3)</strong> o mesmo
            pagamento não libera duas vezes.
          </p>
          <Codigo>{`const produto = produtoPorValor(pagoCentavos);      // 1900 ou 2900
if (!produto) return log("valor fora do catálogo — não libera");

const item = produtoPorReferencia(pedido.external_reference); // FWB3 / PXBTC / COMBO
if (!item) return log("referência sem produto — não libera");

if (jaLiberado(pedido.id)) return log("pagamento repetido — ignora");
`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-400">5.2 — sem banco também dá</h3>
          <p className="leading-relaxed">
            Em deploy serverless o disco é somente leitura: gravar <code>purchases.json</code> não
            persiste. A saída mais simples é não guardar nada e conferir na fonte toda vez que a
            tela abrir: a própria API do provedor responde se aquela ordem está paga. É menos
            rápido e é sempre verdadeiro.
          </p>
          <Codigo>{`// /api/verify-access?mp=ORD-123
const cobranca = await consultarPedido(mp);
return {
  valid: cobranca.status === "pago",
  produto: produtoPorReferencia(cobranca.referencia)?.id ?? null,
};`}</Codigo>
          <Bloco>
            <strong className="text-orange-300">O que nunca fazer:</strong> liberar acesso pelo
            corpo do webhook sem consultar a API, aceitar qualquer valor e usar{" "}
            <code>localStorage</code> como prova de compra. Os três juntos são o padrão de quem
            vende curso de graça sem querer.
          </Bloco>
        </section>
      </div>
    ),
  },
];
