"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUTOS, getProduto, type Produto } from "@/lib/catalogo";
import { MODULOS_FRONTEND_WEB3, type Modulo } from "@/content/frontend-web3";
import { MODULOS_PIX_BITCOIN } from "@/content/pix-bitcoin";

const MODULOS: Record<string, Modulo[]> = {
  "frontend-web3": MODULOS_FRONTEND_WEB3,
  "pix-bitcoin": MODULOS_PIX_BITCOIN,
  // O combo entrega os dois cursos na mesma trilha.
  "combo-web3": [...MODULOS_FRONTEND_WEB3, ...MODULOS_PIX_BITCOIN],
};

/** Produtos que liberam esta página (combo abre os dois cursos). */
function libera(comprado: string | null, atual: string): boolean {
  if (!comprado) return false;
  if (comprado === atual) return true;
  return comprado === "combo-web3" && (atual === "frontend-web3" || atual === "pix-bitcoin");
}

type PixState = {
  pix_copy: string;
  pix_amount: number;
  qr_png?: string;
  link_pagamento?: string;
  status_url?: string;
  id: string;
  manual?: boolean;
};

type BtcState = {
  btc_address: string;
  lightning_invoice: string;
  bip21_uri: string;
  btc_amount_brl: number;
};

export default function CursoView({ slug }: { slug: string }) {
  const produto: Produto = getProduto(slug);

  // Começa como "sem acesso" para a página de venda existir no HTML (SEO e
  // primeiro paint); quem já comprou sobe para a trilha logo depois do load.
  const [acesso, setAcesso] = useState(false);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pix, setPix] = useState<PixState | null>(null);
  const [btc, setBtc] = useState<BtcState | null>(null);
  const [pago, setPago] = useState(false);
  const [moduloAberto, setModuloAberto] = useState<number | null>(1);

  const marcarAcesso = useCallback(
    (comprado: string) => {
      if (!libera(comprado, produto.id)) return;
      const liberados = JSON.parse(localStorage.getItem("cursos_liberados") || "[]");
      if (!liberados.includes(comprado)) {
        localStorage.setItem("cursos_liberados", JSON.stringify([...liberados, comprado]));
      }
      setAcesso(true);
    },
    [produto.id],
  );

  // ---- acesso: `?mp=` (cobrança do provedor) ou o que já ficou salvo no navegador
  useEffect(() => {
    let ativo = true;
    const conferir = async () => {
      const liberados: string[] = JSON.parse(localStorage.getItem("cursos_liberados") || "[]");
      if (liberados.some((l) => libera(l, produto.id))) {
        if (ativo) setAcesso(true);
        return;
      }
      const mp = new URLSearchParams(window.location.search).get("mp");
      if (!mp) return;
      const dados = await fetch(`/api/verify-access?mp=${encodeURIComponent(mp)}`)
        .then((r) => r.json())
        .catch(() => null);
      if (!ativo || !dados?.valid || !libera(dados.produto, produto.id)) return;
      marcarAcesso(dados.produto);
      window.history.replaceState({}, "", `/curso/${produto.slug}`);
    };
    void conferir();
    return () => {
      ativo = false;
    };
  }, [produto.id, produto.slug, marcarAcesso]);

  // ---- confere se o Pix já caiu
  useEffect(() => {
    if (!pix?.status_url || pago) return;
    const timer = setInterval(async () => {
      try {
        const r = await fetch(pix.status_url!);
        const dados = await r.json();
        if (dados.status === "pago" || dados.pago === true) {
          setPago(true);
          if (pix.id) marcarAcesso(produto.id);
        }
      } catch {
        /* silencioso: o polling tenta de novo */
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [pix, pago, produto.id, marcarAcesso]);

  const cpfDigitos = cpf.replace(/\D/g, "");

  async function comprar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await fetch("/api/pix/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: nome, taxId: cpfDigitos, produto: produto.id }),
      });
      const dados = await resposta.json();

      if (resposta.ok) {
        setPix({
          id: dados.order_id,
          pix_copy: dados.qr_code,
          pix_amount: dados.amount,
          qr_png: dados.qr_png,
          link_pagamento: dados.link_pagamento,
          status_url: dados.status_url,
        });
        return;
      }

      if (dados.fallback === "pix_estatico") {
        // Pix manual: gera o BR Code na chave estática e avisa que a liberação é conferida.
        const manual = await fetch("/api/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: nome, method: "pix", produto: produto.id }),
        }).then((r) => r.json());
        setPix({
          id: manual.id,
          pix_copy: manual.pix_copy,
          pix_amount: manual.pix_amount,
          manual: true,
        });
        return;
      }

      setErro(dados.error || dados.motivo || "Não foi possível gerar o Pix.");
    } catch {
      setErro("Falha de conexão ao gerar o pagamento.");
    } finally {
      setCarregando(false);
    }
  }

  async function comprarBitcoin() {
    setErro(null);
    if (!email) {
      setErro("Informe o email antes de escolher Bitcoin.");
      return;
    }
    setCarregando(true);
    try {
      const dados = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: nome, method: "bipa", produto: produto.id }),
      }).then((r) => r.json());
      if (dados.btc_address) {
        setBtc(dados);
      } else {
        setErro(dados.error || "Não foi possível gerar a cobrança em Bitcoin.");
      }
    } catch {
      setErro("Falha ao gerar a cobrança em Bitcoin.");
    } finally {
      setCarregando(false);
    }
  }

  // ---------- ALUNO COM ACESSO ----------
  if (acesso) {
    const modulos = MODULOS[produto.slug] ?? [];
    const totalMin = modulos.reduce((s, m) => s + m.minutes, 0);
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Acesso liberado</p>
            <h1 className="text-3xl font-extrabold">{produto.nome}</h1>
            <p className="text-sm text-neutral-400">
              {modulos.length} módulos · {totalMin} min · acesso vitalício
            </p>
          </header>

          <div className="space-y-4">
            {modulos.map((mod) => (
              <div key={mod.id} className="bg-neutral-900/70 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setModuloAberto(moduloAberto === mod.id ? null : mod.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm font-bold flex items-center justify-center">
                      {String(mod.id).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-semibold">{mod.title}</span>
                      <span className="block text-xs text-neutral-400">{mod.subtitle}</span>
                    </span>
                  </span>
                  <span className="text-xs text-neutral-400">{mod.minutes} min</span>
                </button>
                {moduloAberto === mod.id && (
                  <div className="border-t border-white/10 p-6 text-neutral-200 text-[15px]">
                    {mod.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- PÁGINA DE VENDA ----------
  const modulos = MODULOS[produto.slug] ?? [];
  return (
    <div className="min-h-screen bg-neutral-950 text-white" id="topo">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-widest text-emerald-400">Curso</p>
          <h1 className="text-4xl font-extrabold">{produto.nome}</h1>
          <p className="text-neutral-300 max-w-2xl mx-auto">{produto.chamada}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <h2 className="text-lg font-bold">O que tem dentro</h2>
            <ul className="space-y-3">
              {produto.inclui.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-neutral-300">
                  <span className="text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <h2 className="text-lg font-bold">Módulos</h2>
              {modulos.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between bg-neutral-900/60 border border-white/10 rounded-lg px-4 py-3">
                  <span className="text-sm">
                    <span className="text-emerald-400 font-mono text-xs mr-2">
                      {String(mod.id).padStart(2, "0")}
                    </span>
                    {mod.title}
                  </span>
                  <span className="text-xs text-neutral-400">{mod.minutes} min</span>
                </div>
              ))}
            </div>

            {produto.slug !== "frontend-web3" && produto.slug !== "pix-bitcoin" && (
              <div className="flex flex-wrap gap-3">
                {PRODUTOS.filter((p) => p.slug === "frontend-web3" || p.slug === "pix-bitcoin").map((p) => (
                  <a key={p.id} href={`/curso/${p.slug}`} className="text-sm text-blue-400 underline">
                    Ver {p.nome.replace("Curso: ", "")}
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="p-6 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-neutral-400">Preço de lançamento</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-4xl font-extrabold">R$ {produto.precoCentavos / 100}</span>
                  <span className="text-sm text-neutral-400 line-through">
                    R$ {produto.ancoraCentavos / 100}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Pagamento único · acesso vitalício</p>
              </div>

              <form onSubmit={comprar} className="space-y-3">
                <input
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Seu melhor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={14}
                  placeholder="CPF (exigido pelo Pix)"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={carregando || !email || cpfDigitos.length !== 11}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-400 text-white font-bold rounded-xl transition-all"
                >
                  {carregando ? "Gerando Pix…" : `Pagar R$ ${produto.precoCentavos / 100} no Pix`}
                </button>
                <button
                  type="button"
                  onClick={comprarBitcoin}
                  className="w-full py-3 bg-orange-600/20 border border-orange-500/40 text-orange-300 text-sm font-bold rounded-xl hover:bg-orange-600/30 transition-all"
                >
                  ₿ Pagar com Bitcoin / Lightning
                </button>
              </form>

              {erro && <p className="text-xs text-red-400">{erro}</p>}

              {pix && (
                <div className="p-4 bg-green-950/30 border border-green-500/30 rounded-xl text-sm space-y-3">
                  <p className="text-green-400 font-bold">
                    {pix.manual ? "Pix gerado — confirmação manual" : "Pix gerado!"}
                  </p>
                  <p className="text-neutral-300 text-xs">
                    Pague R$ {Number(pix.pix_amount).toFixed(2)} e o acesso libera{" "}
                    {pix.manual ? "assim que conferirmos" : "automaticamente"}.
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={
                        pix.qr_png ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pix.pix_copy)}`
                      }
                      alt="QR Code Pix"
                      className="bg-white p-2 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pix.pix_copy}
                      className="flex-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-[10px] font-mono text-green-300"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(pix.pix_copy)}
                      className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded-lg"
                    >
                      Copiar
                    </button>
                  </div>
                  {pago && <p className="text-green-400 text-xs font-bold">Pagamento confirmado!</p>}
                </div>
              )}

              {btc && (
                <div className="p-4 bg-orange-950/30 border border-orange-500/30 rounded-xl text-xs space-y-2">
                  <p className="text-orange-300 font-bold">Cobrança em Bitcoin</p>
                  <p className="break-all text-neutral-300">
                    <strong>Endereço:</strong> {btc.btc_address}
                  </p>
                  <p className="break-all text-neutral-400">
                    <strong>Lightning:</strong> {btc.lightning_invoice.slice(0, 60)}…
                  </p>
                  <p className="text-neutral-500">
                    Envie o equivalente a R$ {Number(btc.btc_amount_brl).toFixed(2)} e avise o
                    comprovante; a liberação é conferida.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 text-center">
              Pagamento processado pelo Mercado Pago. Não pedimos senha nem código.
            </p>
          </aside>
        </div>

        {/* FAQ — responde o que trava a compra antes dela acontecer */}
        <section className="max-w-3xl mx-auto space-y-3">
          <h2 className="text-lg font-bold text-center">Perguntas frequentes</h2>
          {[
            {
              q: "Como recebo o acesso depois de pagar?",
              a: "No Pix automático a própria página confirma o pagamento e libera os módulos na hora, no mesmo navegador. Se o pagamento cair no Pix manual ou em Bitcoin, a liberação é conferida e o acesso é enviado para o email informado.",
            },
            {
              q: "Preciso já saber programar?",
              a: "Não para começar. O curso assume lógica de programação básica e ensina o resto no caminho: o projeto começa do zero e cada módulo termina com código funcionando.",
            },
            {
              q: "Quanto tempo leva para terminar?",
              a: `São ${produto.modulos} módulos, cerca de ${Math.round(produto.minutos / 60)} horas de conteúdo e prática. Como o acesso é vitalício, você pode ir no seu ritmo e voltar quando precisar.`,
            },
            {
              q: "Serve para quem já trabalha com desenvolvimento?",
              a: "Sim. Quem já programa em React ou Node aproveita melhor os módulos de contrato, assinatura de transação e tratamento de erro — que é onde a maioria trava ao colocar Web3 em produção.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-3"
            >
              <summary className="cursor-pointer text-sm font-semibold text-neutral-200">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </section>

        <section className="text-center space-y-3 pb-4">
          <p className="text-sm text-neutral-400">
            Acesso vitalício por R$ {produto.precoCentavos / 100}, pagamento único.
          </p>
          <a
            href="#topo"
            className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
          >
            Quero meu acesso
          </a>
        </section>
      </div>
    </div>
  );
}
