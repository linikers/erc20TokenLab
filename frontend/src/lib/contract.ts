import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";

/**
 * Verifica se o MetaMask está disponível no navegador
 */
export const isMetaMaskAvailable = (): boolean => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

/**
 * Retorna uma instância do provedor Web3 (MetaMask)
 * @throws Error se o MetaMask não estiver instalado
 */
export const getProvider = () => {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask não detectada. Instale a extensão para continuar.");
  }
  return new ethers.BrowserProvider(window.ethereum!);
};

/**
 * Retorna uma instância do contrato para leitura ou escrita
 * @param withSigner - true para operações de escrita (transfer, approve)
 */
export const getContract = async (withSigner = false) => {
  const provider = getProvider();

  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

/**
 * Solicita a conexão da wallet via MetaMask
 * @throws Error se o MetaMask não estiver disponível ou o usuário recusar
 */
export const connectWallet = async (): Promise<string> => {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask não encontrada. Instale a extensão no seu navegador.");
  }

  const accounts = await window.ethereum!.request({ method: "eth_requestAccounts" });

  if (!accounts || accounts.length === 0) {
    throw new Error("Nenhuma conta retornada pela MetaMask.");
  }

  return accounts[0];
};

/**
 * Busca o saldo de tokens de um endereço
 * @throws Error se houver falha na comunicação com o contrato
 */
export const getBalance = async (address: string): Promise<string> => {
  const contract = await getContract();
  const balance = await contract.balanceOf(address);
  const decimals = await contract.decimals();
  return ethers.formatUnits(balance, decimals);
};

/**
 * Realiza a transferência de tokens para outro endereço
 * @returns A transação enviada (use tx.wait() para aguardar confirmação)
 * @throws Error se houver saldo insuficiente ou o usuário rejeitar
 */
export const transferTokens = async (
  to: string,
  amount: string
): Promise<ethers.ContractTransactionResponse> => {
  const contract = await getContract(true);
  const decimals = await contract.decimals();
  const amountInWei = ethers.parseUnits(amount, decimals);

  return await contract.transfer(to, amountInWei);
};

/**
 * Busca as informações principais do token (nome, símbolo, supply)
 */
export const getTokenInfo = async () => {
  try {
    const contract = await getContract();
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      address: CONTRACT_ADDRESS,
    };
  } catch (error) {
    console.error("Erro ao buscar informações do token:", error);
    return null;
  }
};
