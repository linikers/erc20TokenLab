"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Context";
import { getContract } from "@/lib/contract";

export default function ApprovePage() {
  const { account, isConnected, loading, connect, chainId } = useWeb3();

  // Approve state
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveStatus, setApproveStatus] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Allowance state
  const [allowanceOwner, setAllowanceOwner] = useState("");
  const [allowanceSpender, setAllowanceSpender] = useState("");
  const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [allowanceError, setAllowanceError] = useState<string | null>(null);

  // TransferFrom state
  const [tfFrom, setTfFrom] = useState("");
  const [tfTo, setTfTo] = useState("");
  const [tfAmount, setTfAmount] = useState("");
  const [tfLoading, setTfLoading] = useState(false);
  const [tfStatus, setTfStatus] = useState<string | null>(null);
  const [tfError, setTfError] = useState<string | null>(null);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveSpender || !approveAmount) return;

    setApproveLoading(true);
    setApproveError(null);
    setApproveStatus(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.approve(
        approveSpender,
        ethers.parseUnits(approveAmount, 18),
      );
      setApproveStatus("Transação enviada! Aguardando confirmação...");
      await tx.wait();
      setApproveStatus("Approve confirmado com sucesso! 🎉");
      setApproveSpender("");
      setApproveAmount("");
    } catch (err: any) {
      setApproveError(err.reason || err.message || "Erro ao aprovar.");
      setApproveStatus(null);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleCheckAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowanceOwner || !allowanceSpender) return;

    setAllowanceLoading(true);
    setAllowanceError(null);
    setAllowanceResult(null);
    try {
      const contract = await getContract();
      const allowance = await contract.allowance(
        allowanceOwner,
        allowanceSpender,
      );
      setAllowanceResult(ethers.formatUnits(allowance, 18));
    } catch (err: any) {
      setAllowanceError(
        err.reason || err.message || "Erro ao consultar allowance.",
      );
    } finally {
      setAllowanceLoading(false);
    }
  };

  const handleTransferFrom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfFrom || !tfTo || !tfAmount) return;

    setTfLoading(true);
    setTfError(null);
    setTfStatus(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.transferFrom(
        tfFrom,
        tfTo,
        ethers.parseUnits(tfAmount, 18),
      );
      setTfStatus("Transação enviada! Aguardando confirmação...");
      await tx.wait();
      setTfStatus("TransferFrom concluído com sucesso! 🎉");
      setTfFrom("");
      setTfTo("");
      setTfAmount("");
    } catch (err: any) {
      setTfError(err.reason || err.message || "Erro no transferFrom.");
      setTfStatus(null);
    } finally {
      setTfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/10 rounded-full">
          <svg
            className="w-10 h-10 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Carteira não conectada</h2>
        <p className="text-neutral-400 max-w-md mx-auto">
          Conecte sua MetaMask para gerenciar aprovações de tokens.
        </p>
        <button
          onClick={connect}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
        >
          Conectar MetaMask
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent inline-block">
          Approve & TransferFrom
        </h1>
        <p className="text-neutral-400">
          Autorize gastos e realize transferências delegadas de tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approve */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Approve
          </h2>
          <form onSubmit={handleApprove} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Endereço do Spender
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={approveSpender}
                onChange={(e) => setApproveSpender(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Quantidade
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-bold">
                  TTK
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={approveLoading || !approveSpender || !approveAmount}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              {approveLoading ? "Processando..." : "Aprovar"}
            </button>
            {approveStatus && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm text-green-400 animate-pulse">
                  {approveStatus}
                </p>
              </div>
            )}
            {approveError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-sm text-red-400">{approveError}</p>
              </div>
            )}
          </form>
        </div>

        {/* Check Allowance */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Consultar Allowance
          </h2>
          <form onSubmit={handleCheckAllowance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Owner (dono dos tokens)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={allowanceOwner}
                onChange={(e) => setAllowanceOwner(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Spender (autorizado)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={allowanceSpender}
                onChange={(e) => setAllowanceSpender(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={
                allowanceLoading || !allowanceOwner || !allowanceSpender
              }
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              {allowanceLoading ? "Consultando..." : "Verificar Allowance"}
            </button>
            {allowanceResult !== null && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <p className="text-sm text-blue-400">
                  Allowance:{" "}
                  <span className="font-bold text-white">
                    {allowanceResult}
                  </span>{" "}
                  TTK
                </p>
              </div>
            )}
            {allowanceError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-sm text-red-400">{allowanceError}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* TransferFrom */}
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          TransferFrom (Transferência Delegada)
        </h2>
        <form onSubmit={handleTransferFrom} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                De (owner)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={tfFrom}
                onChange={(e) => setTfFrom(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Para (destino)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={tfTo}
                onChange={(e) => setTfTo(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Quantidade
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  value={tfAmount}
                  onChange={(e) => setTfAmount(e.target.value)}
                  className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-bold">
                  TTK
                </span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={tfLoading || !tfFrom || !tfTo || !tfAmount}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
          >
            {tfLoading ? "Processando..." : "Executar TransferFrom"}
          </button>
          {tfStatus && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-sm text-green-400 animate-pulse">
                {tfStatus}
              </p>
            </div>
          )}
          {tfError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <p className="text-sm text-red-400">{tfError}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
