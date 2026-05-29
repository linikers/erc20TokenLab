"use client";

import { useState } from "react";

export default function Home() {
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmail) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail, name: checkoutName }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Erro ao criar pagamento.");
      }
    } catch {
      setCheckoutError("Erro de conexão. Tente novamente.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Bem-vindo ao{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              ERC20 Token Lab
            </span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Crie, gerencie e transfira seus próprios tokens ERC20 com
            facilidade e segurança. Uma plataforma completa para experimentar o
            ecossistema Web3.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/token"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
          >
            Explorar Token
          </a>
          <a
            href="/how-to-use"
            className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-all"
          >
            Como Funciona
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left max-w-5xl">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-bold mb-2 text-blue-400">
              Gerenciamento
            </h3>
            <p className="text-neutral-400 text-sm">
              Visualize o saldo e informações principais do seu token em tempo
              real.
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-bold mb-2 text-purple-400">
              Transferência
            </h3>
            <p className="text-neutral-400 text-sm">
              Envie tokens para qualquer endereço com apenas alguns cliques.
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-bold mb-2 text-green-400">Seguro</h3>
            <p className="text-neutral-400 text-sm">
              Integração direta com MetaMask para transações seguras na
              blockchain.
            </p>
          </div>
        </div>
      </div>

      {/* Course Section */}
      <div className="max-w-4xl mx-auto" id="curso">
        <div className="text-center space-y-4 mb-12">
          <span className="inline-block px-4 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 uppercase tracking-wider">
            Novo
          </span>
          <h2 className="text-4xl font-bold">
            Do Zero ao{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Seu Token ERC20
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Aprenda blockchain, Solidity, Next.js e Web3 do absoluto zero.
            Monte seu portfólio e lance seu próprio token na Ethereum.
          </p>
        </div>

        {/* Course Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {[
            "8 módulos completos do zero ao deploy",
            "Código-fonte do Token Lab incluído",
            "Solidity + OpenZeppelin na prática",
            "Frontend Web3 com Next.js + Ethers.js",
            "Deploy em testnet Sepolia passo a passo",
            "Acesso vitalício + atualizações",
            "Suporte via comunidade",
            "Certificado de conclusão",
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <svg
                className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-neutral-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="p-8 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-2xl text-center space-y-6">
            <div>
              <p className="text-sm text-neutral-400 uppercase tracking-wider mb-2">
                Preço de lançamento
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-extrabold text-white">
                  R$ 19
                </span>
                <span className="text-sm text-neutral-500 line-through">
                  R$ 49
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Pagamento único • Acesso vitalício
              </p>
            </div>

            <form onSubmit={handleBuy} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Seu nome (opcional)"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  required
                  placeholder="Seu melhor email"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={checkoutLoading || !checkoutEmail}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                {checkoutLoading ? "Processando..." : "Comprar Agora"}
              </button>
            </form>

            {checkoutError && (
              <p className="text-red-400 text-sm">{checkoutError}</p>
            )}

            <p className="text-xs text-neutral-500">
              Pagamento processado pelo Mercado Pago • Pix, cartão ou boleto
            </p>
          </div>
        </div>

        {/* Modules Preview */}
        <div className="mt-12 space-y-4">
          <h3 className="text-xl font-bold text-center">O que você vai aprender</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { num: "01", title: "Blockchain", desc: "Fundamentos, consenso, hash" },
              { num: "02", title: "Ethereum", desc: "EVM, Smart Contracts, Gas" },
              { num: "03", title: "Solidity", desc: "ERC20, OpenZeppelin, deploy" },
              { num: "04", title: "Hardhat", desc: "Testes, scripts, redes" },
              { num: "05", title: "Frontend", desc: "Next.js, Ethers.js, MetaMask" },
              { num: "06", title: "Deploy", desc: "Sepolia, Mainnet, Etherscan" },
              { num: "07", title: "Avançado", desc: "Mint, Burn, Approve" },
              { num: "08", title: "Marketing", desc: "Tokenomics, comunidade" },
            ].map((mod) => (
              <div
                key={mod.num}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/[0.07] transition-colors"
              >
                <span className="text-xs text-emerald-400 font-bold">
                  MÓDULO {mod.num}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  {mod.title}
                </h4>
                <p className="text-xs text-neutral-500 mt-1">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="max-w-2xl mx-auto text-center space-y-6 p-12 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl">
        <h2 className="text-3xl font-bold">
          Pronto para dominar Web3?
        </h2>
        <p className="text-neutral-400">
          R$ 19 é menos que um pizza. Invista no seu futuro como desenvolvedor
          blockchain.
        </p>
        <a
          href="#curso"
          className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg"
        >
          Quero Meu Acesso
        </a>
      </div>
    </div>
  );
}
