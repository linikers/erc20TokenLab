import { describe, it, expect } from "vitest";
import { crc16, gerarPixEstatico } from "@/lib/pix";

/**
 * PAYLOAD DE REFERÊNCIA — gerado por implementação independente (biblioteca
 * `pix-utils`) com os mesmos dados. Se este teste quebrar, o copia-e-cola do
 * PIX estático deixou de ser aceito por app de banco.
 */
const REFERENCIA =
  "00020126580014BR.GOV.BCB.PIX0136010d0101-9109-4cd1-bf05-cad25bebd1d2520400005303986540519.005802BR5911CURSO ERC206009SAO PAULO62200516PIX17920104196346304929F";

interface Campo {
  tag: string;
  valor: string;
}

/** Parser TLV estrito: qualquer tag/tamanho fora do padrão derruba. */
function parseTLV(payload: string): Campo[] {
  const campos: Campo[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const tamanho = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(tamanho)) {
      throw new Error(`TLV inválido na posição ${i}: ${JSON.stringify(payload.slice(i, i + 6))}`);
    }
    const valor = payload.slice(i + 4, i + 4 + Number(tamanho));
    if (valor.length !== Number(tamanho)) {
      throw new Error(`valor curto em ${tag}: esperado ${tamanho}, veio ${valor.length}`);
    }
    campos.push({ tag, valor });
    i += 4 + Number(tamanho);
  }
  return campos;
}

function buscar(campos: Campo[], tag: string): Campo | undefined {
  return campos.find((c) => c.tag === tag);
}

describe("pix estático (BR Code)", () => {
  const params = {
    chave: "010d0101-9109-4cd1-bf05-cad25bebd1d2",
    nome: "CURSO ERC20",
    cidade: "SAO PAULO",
    valorReais: 19,
    txid: "PIX1792010419634",
  };

  it("bate com o payload de referência (implementação independente)", () => {
    expect(gerarPixEstatico(params)).toBe(REFERENCIA);
  });

  it("tem a estrutura EMV que o app do banco exige", () => {
    const campos = parseTLV(gerarPixEstatico(params));

    expect(buscar(campos, "00")?.valor).toBe("01");
    expect(buscar(campos, "26")?.valor).toContain("BR.GOV.BCB.PIX");
    expect(buscar(campos, "26")?.valor).toContain(params.chave);
    expect(buscar(campos, "52")?.valor).toMatch(/^\d{4}$/); // categoria
    expect(buscar(campos, "53")?.valor).toBe("986"); // BRL
    expect(buscar(campos, "54")?.valor).toBe("19.00");
    expect(buscar(campos, "58")?.valor).toBe("BR");
    expect(buscar(campos, "59")?.valor).toBe("CURSO ERC20");
    expect(buscar(campos, "60")?.valor).toBe("SAO PAULO");

    // o txid mora no sub-campo 05 dentro de 62 (era o defeito do gerador antigo)
    const adicional = buscar(campos, "62");
    expect(adicional).toBeTruthy();
    const subcampos = parseTLV(adicional!.valor);
    expect(subcampos).toHaveLength(1);
    expect(subcampos[0].tag).toBe("05");
    expect(subcampos[0].valor).toBe("PIX1792010419634");
  });

  it("tags em ordem crescente e CRC16 conferido", () => {
    const payload = gerarPixEstatico(params);
    const campos = parseTLV(payload);
    const tags = campos.map((c) => Number(c.tag));
    expect(tags).toEqual([...tags].sort((a, b) => a - b));

    const crc = buscar(campos, "63")?.valor;
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
    expect(crc16(payload.slice(0, -4))).toBe(crc);
  });

  it("sanitiza o txid (nada de '_' quebrando o payload)", () => {
    const payload = gerarPixEstatico({ ...params, txid: "pix_1792010419634" });
    const adicional = buscar(parseTLV(payload), "62")!;
    const subcampos = parseTLV(adicional.valor);
    expect(subcampos[0].valor).toBe("pix1792010419634");
    expect(subcampos[0].valor.length).toBeLessThanOrEqual(25);
  });

  it("sem txid usa o rótulo padrão ***", () => {
    const adicional = buscar(parseTLV(gerarPixEstatico({ ...params, txid: undefined })), "62")!;
    expect(parseTLV(adicional.valor)[0].valor).toBe("***");
  });

  it("o payload ANTIGO era inválido (regressão documentada)", () => {
    const antigo =
      "00020126580014BR.GOV.BCB.PIX0136010d0101-9109-4cd1-bf05-cad25bebd1d20411CURSO ERC20060519.000509SAO PAULO6217pix_179201041963463044739";
    const campos = parseTLV(antigo);

    // o gerador antigo usava nome/valor/cidade nas tags 04/06/05 (corretas: 59/54/60)
    expect(campos.map((c) => c.tag)).toEqual(["00", "26", "04", "06", "05", "62", "63"]);
    // e não emitia categoria, moeda nem país — obrigatórios no BR Code
    expect(buscar(campos, "52")).toBeUndefined();
    expect(buscar(campos, "53")).toBeUndefined();
    expect(buscar(campos, "58")).toBeUndefined();
    expect(buscar(campos, "59")).toBeUndefined();
    expect(buscar(campos, "60")).toBeUndefined();
    // o txid entrou cru dentro de 62, sem o sub-campo 05 — é o que faz o app
    // do banco recusar o código ("não é um PIX")
    expect(() => parseTLV(buscar(campos, "62")!.valor)).toThrow();
  });
});
