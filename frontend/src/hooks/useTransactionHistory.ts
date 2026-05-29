"use client";

import { useState, useCallback } from "react";

export interface TxRecord {
  hash: string;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  timestamp: number;
  network: string;
}

const STORAGE_KEY = "erc20_tx_history";

function loadHistory(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<TxRecord[]>(loadHistory);

  const addTransaction = useCallback((tx: TxRecord) => {
    setTransactions((prev) => {
      const updated = [tx, ...prev].slice(0, 100); // keep last 100
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTransactions([]);
  }, []);

  return { transactions, addTransaction, clearHistory };
}
