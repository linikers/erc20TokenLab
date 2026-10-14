/**
 * Gerador de PIX estático (copia-e-cola) no padrão EMV® QRCPS-MPM / BR Code do Bacen.
 *
 * O gerador anterior montava o payload com as tags erradas — `04` para o nome,
 * `06` para o valor e `05` para a cidade (as corretas são `59`, `54` e `60`),
 * não emitia `52` (categoria), `53` (moeda) nem `58` (país), e colocava o txid
 * direto dentro de `62` sem o sub-campo `05`. O resultado é um payload que
 * **nenhum app de banco aceita** ("não é um código PIX").
 *
 * A referência conferida é um payload gerado por implementação independente
 * (biblioteca `pix-utils`) para os mesmos dados — está fixado no teste
 * `src/__tests__/pix.test.ts`.
 */

export interface PixEstaticoParams {
  /** Chave PIX da conta recebedora (EVP/UUID, e-mail, telefone, CPF ou CNPJ). */
  chave: string;
  /** Nome do recebedor (até 25 caracteres). */
  nome: string;
  /** Cidade do recebedor (até 15 caracteres). */
  cidade: string;
  /** Valor em reais. */
  valorReais: number;
  /** Identificador do pagamento — só letras e números, até 25 (vira o `05` dentro de `62`). */
  txid?: string;
}

/** CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — o exigido pelo BR Code. */
export function crc16(payload: string): string {
  const poly = 0x1021;
  let reg = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    const byte = payload.charCodeAt(i);
    reg ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if (reg & 0x8000) reg = (reg << 1) ^ poly;
      else reg <<= 1;
      reg &= 0xffff;
    }
  }
  return reg.toString(16).toUpperCase().padStart(4, "0");
}

/** Monta um campo no formato EMV: tag (2) + tamanho (2) + valor. */
function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

function normalizar(texto: string, max: number): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 .,-]/g, "")
    .trim()
    .slice(0, max);
}

function normalizarTxid(txid?: string): string {
  const limpo = (txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  return limpo || "***";
}

/**
 * Devolve o copia-e-cola do PIX estático. Campos em ordem crescente de tag,
 * como o BR Code exige.
 */
export function gerarPixEstatico(params: PixEstaticoParams): string {
  const conteudoMai =
    campo("00", "BR.GOV.BCB.PIX") + campo("01", params.chave.trim());

  const semCRC =
    campo("00", "01") +
    campo("26", conteudoMai) +
    campo("52", "0000") + // categoria do estabelecimento
    campo("53", "986") + // moeda: BRL
    campo("54", params.valorReais.toFixed(2)) +
    campo("58", "BR") +
    campo("59", normalizar(params.nome, 25)) +
    campo("60", normalizar(params.cidade, 15)) +
    campo("62", campo("05", normalizarTxid(params.txid))) +
    "6304";

  return `${semCRC}${crc16(semCRC)}`;
}
