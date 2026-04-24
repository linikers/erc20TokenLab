import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Uma private key válida tem 64 caracteres hex (32 bytes)
const isValidPrivateKey = PRIVATE_KEY.length === 64 || PRIVATE_KEY.length === 66;
const isSepoliaReady = Boolean(SEPOLIA_RPC_URL) && isValidPrivateKey;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    ...(isSepoliaReady
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [
              PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`,
            ],
            chainId: 11155111,
          },
        }
      : {}),
  },
};

export default config;
