/**
 * Constantes do produto — uma fonte só para o preço, senão o valor cobrado e o
 * valor mostrado na landing divergem (e o webhook passa a recusar por valor).
 */

/** R$ 19,00 em centavos. */
export const PRECO_CENTAVOS = 1900;

export const PRODUTO = "Curso: Do Zero ao seu Token ERC20";

/** Validade do QR PIX em minutos (default 60; `PAGBANK_PIX_MINUTOS` sobrepõe). */
export function expiracaoPixMinutos(): number {
  return Number(process.env.PAGBANK_PIX_MINUTOS || 60);
}
