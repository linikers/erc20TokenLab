"use client";

import { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  getBalance,
  transferTokens,
  isMetaMaskAvailable,
} from "@/lib/contract";

export default function Home() {
  // Estado da wallet
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do token
  const [balance, setBalance] = useState<string>("0");

  // Estado da transferência
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const userBalance = await getBalance(address);
      setBalance(userBalance);
    } catch (err: any) {
      console.error("[TokenLab] Erro ao buscar saldo:", err);
    }
  }, []);

  const handleConnect = async () => {
    console.log("[TokenLab] Botão conectar clicado");
    setError(null);
    setConnecting(true);

    try {
      if (!isMetaMaskAvailable()) {
        throw new Error(
          "MetaMask não encontrada. Instale a extensão no seu navegador."
        );
      }

      console.log("[TokenLab] Solicitando contas ao MetaMask...");
      const address = await connectWallet();

      console.log("[TokenLab] Conectado com sucesso:", address);
      setWalletAddress(address);
      await fetchBalance(address);
    } catch (err: any) {
      const errorMessage = err.reason || err.message || "Erro desconhecido";
      console.error("[TokenLab] Erro na conexão:", errorMessage);
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleTransfer = async () => {
    if (!walletAddress) return;

    console.log(
      `[TokenLab] Transferindo ${amount} TTK para ${recipient}...`
    );
    setTransferLoading(true);
    setTransferStatus({ type: "info", message: "Processando transferência..." });

    try {
      const tx = await transferTokens(recipient, amount);
      console.log("[TokenLab] TX enviada:", tx.hash);
      setTransferStatus({
        type: "info",
        message: `TX enviada: ${tx.hash.slice(0, 10)}... Aguardando confirmação.`,
      });

      await tx.wait();

      console.log("[TokenLab] Transferência confirmada!");
      setTransferStatus({
        type: "success",
        message: "Transferência concluída com sucesso!",
      });
      await fetchBalance(walletAddress);
      setAmount("");
      setRecipient("");
    } catch (err: any) {
      const errorMessage = err.reason || err.message || "Erro desconhecido";
      console.error("[TokenLab] Erro na transferência:", errorMessage);
      setTransferStatus({ type: "error", message: errorMessage });
    } finally {
      setTransferLoading(false);
    }
  };

  // Atualiza saldo a cada 10s
  useEffect(() => {
    if (walletAddress) {
      const interval = setInterval(() => fetchBalance(walletAddress), 10000);
      return () => clearInterval(interval);
    }
  }, [walletAddress, fetchBalance]);

  // Cores do status de transferência
  const statusStyles = {
    success:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    error:
      "bg-red-500/10 border-red-500/20 text-red-400",
    info:
      "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-slate-200 p-8 flex flex-col items-center justify-center selection:bg-blue-500/30">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-800">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">
            TokenLab
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Ethereum ERC20 Dashboard
          </p>
        </header>

        {/* Bloco de erro global (conexão) */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <span className="text-red-400 text-lg leading-none mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-red-400 text-sm font-semibold">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500/60 text-xs mt-1 hover:text-red-400 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {!walletAddress ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full relative group overflow-hidden bg-blue-600 font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-wait"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {connecting && (
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {connecting ? "Conectando..." : "Conectar MetaMask"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] block mb-2">
                  Carteira Ativa
                </span>
                <p className="text-xs font-mono break-all text-blue-400/90">
                  {walletAddress}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] block mb-1">
                    Saldo em Token
                  </span>
                  <p className="text-3xl font-black text-white">
                    {parseFloat(balance).toLocaleString()}{" "}
                    <span className="text-lg font-medium text-slate-400">
                      TTK
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <form
              className="space-y-4 pt-6 border-t border-slate-800/50"
              onSubmit={(e) => {
                e.preventDefault();
                handleTransfer();
              }}
            >
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] block mb-2 px-1">
                  Destinatário
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] block mb-2 px-1">
                  Quantia
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={transferLoading || !recipient || !amount}
                className="w-full bg-slate-100 text-slate-950 font-bold py-4 rounded-2xl transition hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed shadow-xl active:scale-95"
              >
                {transferLoading ? "Processando..." : "Transferir Tokens"}
              </button>

              {transferStatus && (
                <div
                  className={`border rounded-xl p-3 text-center ${statusStyles[transferStatus.type]}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">
                    {transferStatus.message}
                  </p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
      <footer className="mt-8 text-slate-600 text-[10px] tracking-widest font-bold">
        Built with Hardhat & Next by LinikerS
      </footer>
    </main>
  );
}
