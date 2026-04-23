"use client";

import { useState, useEffect } from "react";
import * as Web3Lib from "@/lib/contract";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleConnect = async () => {
    const connectedAccount = await Web3Lib.connectWallet();
    console.log(connectedAccount);
    console.log("teste");
    if (connectedAccount) {
      setAccount(connectedAccount);
      await fetchBalance(connectedAccount);
    }
  };

  const fetchBalance = async (userAddress: string) => {
    const userBalance = await Web3Lib.getBalance(userAddress);
    setBalance(userBalance);
  };

  const handleTransfer = async () => {
    if (!account) return;

    setLoading(true);
    setStatus("Processando transferência...");

    try {
      const tx = await Web3Lib.transferTokens(recipient, amount);
      setStatus("Transação enviada! Aguardando confirmação...");

      await tx.wait();

      setStatus("Transferência concluída!");
      await fetchBalance(account);
      setAmount("");
      setRecipient("");
    } catch (err: any) {
      console.error(err);
      setStatus("Erro: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      const interval = setInterval(() => fetchBalance(account), 10000);
      return () => clearInterval(interval);
    }
  }, [account]);

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

        {!account ? (
          <button
            onClick={handleConnect}
            className="w-full relative group overflow-hidden bg-blue-600 font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
          >
            <span className="relative z-10">Conectar MetaMask</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] block mb-2">
                  Carteira Ativa
                </span>
                <p className="text-xs font-mono break-all text-blue-400/90">
                  {account}
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
                disabled={loading || !recipient || !amount}
                className="w-full bg-slate-100 text-slate-950 font-bold py-4 rounded-2xl transition hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed shadow-xl active:scale-95"
              >
                {loading ? "Processando..." : "Transferir Tokens"}
              </button>

              {status && (
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-center">
                  <p className="text-[10px] animate-pulse text-blue-400 font-bold uppercase tracking-widest leading-none">
                    {status}
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
