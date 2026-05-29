"use client";

import { useState, useCallback } from "react";
import { connectWallet, transferTokens } from "@/lib/contract";

export default function TransferPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      const address = await connectWallet();
      if (address) {
        setAccount(address);
      } else {
        setError("Não foi possível conectar a carteira.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar.");
    }
  }, []);

  const handleTransfer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!account || !recipient || !amount) return;

      setLoading(true);
      setError(null);
      setStatus("Iniciando transferência...");

      try {
        const tx = await transferTokens(recipient, amount);
        setStatus("Transação enviada! Aguardando confirmação...");

        await tx.wait();
        setStatus("Transferência concluída com sucesso! 🎉");
        setAmount("");
        setRecipient("");
      } catch (err: any) {
        console.error(err);
        setError(err.reason || err.message || "Erro ao transferir.");
        setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [account, recipient, amount],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">Transferir Tokens</h1>
        <p className="text-neutral-400">
          Envie seus tokens para qualquer carteira na rede.
        </p>
      </div>

      {!account ? (
        <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Carteira não conectada</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            Conecte sua MetaMask para começar a transferir tokens.
          </p>
          <button
            onClick={handleConnect}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
          >
            Conectar MetaMask
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 font-medium">
              Conectado como:
            </p>
            <code className="text-xs text-green-300 truncate max-w-[220px]">
              {account}
            </code>
            <button
              onClick={() => setAccount(null)}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Desconectar
            </button>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Endereço de Destino
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Quantidade
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">
                  TOKEN
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !recipient || !amount}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              {loading ? "Processando..." : "Confirmar Transferência"}
            </button>
          </form>

          {status && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <p className="text-sm text-blue-400 animate-pulse">{status}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 text-center leading-relaxed">
              Certifique-se de estar conectado à rede correta no MetaMask antes
              de confirmar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
