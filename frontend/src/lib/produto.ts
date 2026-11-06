/**
 * Compatibilidade: rotas e telas antigas importam daqui. O preço e o nome do
 * produto agora vêm do catálogo (`catalogo.ts`) — um lugar só para preço, senão
 * a landing mostra um valor e o webhook recusa o pagamento por divergência.
 */

import { getProduto, PRODUTO_PADRAO } from "./catalogo";

const PADRAO = getProduto(PRODUTO_PADRAO);

/** R$ 19,00 em centavos (curso principal). */
export const PRECO_CENTAVOS = PADRAO.precoCentavos;

export const PRODUTO = PADRAO.nome;

/** Validade do QR PIX em minutos (default 60; `PAGBANK_PIX_MINUTOS` sobrepõe). */
export function expiracaoPixMinutos(): number {
  return Number(process.env.PAGBANK_PIX_MINUTOS || 60);
}
