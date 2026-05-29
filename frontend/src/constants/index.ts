// Configurações de rede - usar .env.local para override
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const NETWORK_NAME =
  process.env.NEXT_PUBLIC_NETWORK_NAME || "Local Hardhat";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

// Explorers por chain
export const EXPLORERS: Record<number, string> = {
  31337: "", // Local Hardhat - sem explorer
  11155111: "https://sepolia.etherscan.io",
};

export const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function adminBurn(address account, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];
