import { describe, it, expect } from "vitest";
import {
  PRODUTOS,
  getProduto,
  produtoPorReferencia,
  produtoPorValor,
} from "@/lib/catalogo";

describe("catálogo de produtos", () => {
  it("tem prefixo de referência único por produto", () => {
    const prefixos = PRODUTOS.map((p) => p.refPrefixo);
    expect(new Set(prefixos).size).toBe(prefixos.length);
  });

  it("descobre o produto pelo prefixo da referência do provedor", () => {
    expect(produtoPorReferencia("FWB3-1730000000-fulano@x.com")?.id).toBe("frontend-web3");
    expect(produtoPorReferencia("PXBTC-1730000000-fulano@x.com")?.id).toBe("pix-bitcoin");
    expect(produtoPorReferencia("COMBO-1730000000-fulano@x.com")?.id).toBe("combo-web3");
    expect(produtoPorReferencia("ERC20-1730000000-fulano@x.com")?.id).toBe("curso-erc20");
    expect(produtoPorReferencia("XPTO-1-2")).toBeNull();
    expect(produtoPorReferencia("")).toBeNull();
  });

  it("só aceita valor que existe no catálogo", () => {
    expect(produtoPorValor(1900)?.id).toBe("curso-erc20");
    expect(produtoPorValor(2900)?.id).toBe("combo-web3");
    expect(produtoPorValor(1)).toBeNull();
    expect(produtoPorValor(0)).toBeNull();
  });

  it("cai no produto padrão quando o id não existe (nunca em preço zero)", () => {
    expect(getProduto("nao-existe").id).toBe("curso-erc20");
    expect(getProduto("nao-existe").precoCentavos).toBe(1900);
    expect(getProduto(undefined).id).toBe("curso-erc20");
  });

  it("todo produto tem página de acesso e preço maior que zero", () => {
    for (const p of PRODUTOS) {
      expect(p.precoCentavos).toBeGreaterThan(0);
      expect(p.paginaAcesso.startsWith("/")).toBe(true);
      expect(p.ancoraCentavos).toBeGreaterThan(p.precoCentavos);
    }
  });
});
