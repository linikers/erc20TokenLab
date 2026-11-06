/**
 * Catálogo de produtos — fonte única de preço, nome e destino do acesso.
 *
 * Antes existia uma constante só (`produto.ts`); com mais de um curso no mesmo
 * checkout, o preço e o produto comprado passaram a viajar juntos na referência
 * da cobrança (`<PREFIXO>-<timestamp>-<email>`), porque a Vercel é read-only e
 * não há banco para gravar a compra. Quem lê a referência descobre o produto.
 */

export type ProdutoId =
  | "curso-erc20"
  | "frontend-web3"
  | "pix-bitcoin"
  | "combo-web3";

export interface Produto {
  id: ProdutoId;
  nome: string;
  /** Usado na URL pública do curso: /curso/<slug> */
  slug: string;
  chamada: string;
  /** Preço cobrado, em centavos. */
  precoCentavos: number;
  /** Preço "de" (riscado) na página. */
  ancoraCentavos: number;
  modulos: number;
  minutos: number;
  inclui: string[];
  /** Prefixo da referência enviada ao provedor de pagamento. */
  refPrefixo: string;
  /** Página liberada depois do pagamento confirmado. */
  paginaAcesso: string;
}

export const PRODUTOS: Produto[] = [
  {
    id: "curso-erc20",
    nome: "Curso: Do Zero ao seu Token ERC20",
    slug: "curso-erc20",
    chamada:
      "Aprenda blockchain, Solidity, Next.js e Web3 do zero e lance seu próprio token na Ethereum.",
    precoCentavos: 1900,
    ancoraCentavos: 4900,
    modulos: 8,
    minutos: 210,
    inclui: [
      "8 módulos completos do zero ao deploy",
      "Código-fonte do Token Lab incluído",
      "Solidity + OpenZeppelin na prática",
      "Frontend Web3 com Next.js + Ethers.js",
      "Deploy em testnet Sepolia passo a passo",
      "Acesso vitalício + atualizações",
    ],
    refPrefixo: "ERC20",
    paginaAcesso: "/course",
  },
  {
    id: "frontend-web3",
    nome: "Curso: Frontend Web3 na Prática",
    slug: "frontend-web3",
    chamada:
      "Ligue um contrato ERC20 a uma interface Next.js de verdade: MetaMask, leitura de saldo, transferência e tratamento de erro.",
    precoCentavos: 1900,
    ancoraCentavos: 4900,
    modulos: 5,
    minutos: 150,
    inclui: [
      "Projeto-base: este próprio Token Lab",
      "MetaMask e provider EIP-1193 sem biblioteca mágica",
      "ABI mínima: name, symbol, decimals, balanceOf",
      "Transfer e approve com confirmação de transação",
      "Deploy do front na Vercel com variáveis de ambiente",
    ],
    refPrefixo: "FWB3",
    paginaAcesso: "/curso/frontend-web3",
  },
  {
    id: "pix-bitcoin",
    nome: "Curso: Pix e Bitcoin no seu Produto",
    slug: "pix-bitcoin",
    chamada:
      "Cobre em Pix e Bitcoin sem intermediário: BR Code na mão, Pix automático por API, Lightning e liberação de acesso por webhook.",
    precoCentavos: 1900,
    ancoraCentavos: 4900,
    modulos: 5,
    minutos: 165,
    inclui: [
      "Gerador de BR Code (Pix estático) com CRC16",
      "Pix automático com Orders API e QR dinâmico",
      "Bitcoin on-chain e Lightning (invoice + BIP21)",
      "Webhook como aviso, API como fonte da verdade",
      "Idempotência e validação de valor para não liberar de graça",
    ],
    refPrefixo: "PXBTC",
    paginaAcesso: "/curso/pix-bitcoin",
  },
  {
    id: "combo-web3",
    nome: "Combo: Frontend Web3 + Pix e Bitcoin",
    slug: "combo-web3",
    chamada:
      "Os dois cursos novos juntos: a interface Web3 e o checkout em Pix/Bitcoin do mesmo projeto.",
    precoCentavos: 2900,
    ancoraCentavos: 5900,
    modulos: 10,
    minutos: 315,
    inclui: [
      "Curso Frontend Web3 na Prática",
      "Curso Pix e Bitcoin no seu Produto",
      "Código-fonte dos dois projetos",
      "Acesso vitalício aos dois",
    ],
    refPrefixo: "COMBO",
    paginaAcesso: "/curso/frontend-web3",
  },
];

export const PRODUTO_PADRAO: ProdutoId = "curso-erc20";

export function getProduto(id?: string | null): Produto {
  const achado = PRODUTOS.find((p) => p.id === id);
  return achado ?? PRODUTOS[0];
}

/** Produto pelo prefixo da referência (`FWB3-1730...-fulano@x.com`). */
export function produtoPorReferencia(referencia?: string | null): Produto | null {
  if (!referencia) return null;
  const prefixo = String(referencia).split("-")[0]?.toUpperCase();
  return PRODUTOS.find((p) => p.refPrefixo === prefixo) ?? null;
}

/** Produto cujo preço bate com o valor efetivamente cobrado. */
export function produtoPorValor(centavos: number): Produto | null {
  return PRODUTOS.find((p) => p.precoCentavos === centavos) ?? null;
}

export function reais(centavos: number): string {
  return (centavos / 100).toFixed(0);
}
