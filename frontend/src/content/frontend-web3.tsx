import type { ReactNode } from "react";

export interface Modulo {
  id: number;
  title: string;
  subtitle: string;
  minutes: number;
  content: ReactNode;
}

const Codigo = ({ children }: { children: string }) => (
  <pre className="bg-neutral-950 border border-white/10 rounded-lg p-4 text-xs overflow-x-auto">
    <code className="text-emerald-300 font-mono whitespace-pre">{children}</code>
  </pre>
);

const Bloco = ({ children }: { children: ReactNode }) => (
  <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-4 text-sm">
    {children}
  </div>
);

export const MODULOS_FRONTEND_WEB3: Modulo[] = [
  {
    id: 1,
    title: "Projeto e ambiente",
    subtitle: "Next.js App Router + ethers 6",
    minutes: 22,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.1 — o mínimo para começar</h3>
          <p className="leading-relaxed">
            Um frontend Web3 é um site comum com três peças a mais: uma <strong>carteira</strong>{" "}
            (MetaMask), uma <strong>biblioteca que fala com a rede</strong> (ethers) e o{" "}
            <strong>endereço + ABI do contrato</strong>. Todo o resto é React.
          </p>
          <Codigo>{`npx create-next-app@latest meu-token-lab --ts --app --tailwind
cd meu-token-lab
npm i ethers`}</Codigo>
          <p className="leading-relaxed">
            O ethers 6 mudou a API em relação ao v5: não existe mais{" "}
            <code>new ethers.providers.Web3Provider</code>. Agora é{" "}
            <code>new ethers.BrowserProvider(window.ethereum)</code>. Código de tutorial antigo
            quebra aqui — confira a versão antes de copiar.
          </p>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.2 — variáveis de ambiente</h3>
          <p className="leading-relaxed">
            Endereço de contrato e RPC não podem ficar soltos no código: o mesmo projeto roda em
            localhost, testnet e mainnet. No Next, só o que começa com{" "}
            <code>NEXT_PUBLIC_</code> chega ao navegador — e tudo que chega ao navegador é
            público. Chave privada nunca entra aqui.
          </p>
          <Codigo>{`# .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0xSeuContrato
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com`}</Codigo>
          <Bloco>
            <strong className="text-blue-300">Regra:</strong> o navegador só recebe endereço,
            chainId e URL pública. Qualquer segredo (chave de API privada, private key) fica em
            rota de servidor (<code>app/api/*</code>) ou em variável sem{" "}
            <code>NEXT_PUBLIC_</code>.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 2,
    title: "MetaMask e o provider",
    subtitle: "EIP-1193 sem biblioteca mágica",
    minutes: 30,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.1 — conectar e ler a conta</h3>
          <p className="leading-relaxed">
            A carteira injeta <code>window.ethereum</code>. Conectar é pedir permissão com{" "}
            <code>eth_requestAccounts</code>; ler sem pedir nada é <code>eth_accounts</code>.
            A diferença importa: abrir a página não deve disparar popup.
          </p>
          <Codigo>{`const provider = new ethers.BrowserProvider(window.ethereum);
const contas = await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
console.log("conectado:", contas[0]);`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.2 — eventos: troca de conta e de rede</h3>
          <p className="leading-relaxed">
            Quem ignora evento mostra saldo da conta anterior. Dois eventos resolvem:{" "}
            <code>accountsChanged</code> e <code>chainChanged</code>. Sempre remova o listener no
            cleanup do <code>useEffect</code>, senão cada remontagem duplica o handler.
          </p>
          <Codigo>{`useEffect(() => {
  if (!window.ethereum) return;
  const aoTrocarConta = (contas: string[]) => setConta(contas[0] ?? null);
  const aoTrocarRede = () => window.location.reload(); // simples e seguro
  window.ethereum.on("accountsChanged", aoTrocarConta);
  window.ethereum.on("chainChanged", aoTrocarRede);
  return () => {
    window.ethereum.removeListener("accountsChanged", aoTrocarConta);
    window.ethereum.removeListener("chainChanged", aoTrocarRede);
  };
}, []);`}</Codigo>
          <Bloco>
            <strong className="text-blue-300">Pitfall real:</strong> trocar de rede pelo painel da
            MetaMask recarrega o contexto da página. Recarregar no <code>chainChanged</code> é a
            decisão mais barata e evita estado inconsistente entre provider e contrato.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 3,
    title: "Lendo o contrato",
    subtitle: "ABI mínima e formatação de saldo",
    minutes: 28,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.1 — ABI mínima (não precisa do JSON inteiro)</h3>
          <p className="leading-relaxed">
            Para ler e transferir ERC20 você só precisa de cinco funções. Uma ABI enxuta deixa o
            bundle menor e o código legível.
          </p>
          <Codigo>{`const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
];`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.2 — decimals é obrigatório</h3>
          <p className="leading-relaxed">
            O contrato guarda inteiros. 1 token com 18 casas é <code>1000000000000000000</code>.
            Mostrar esse número na tela é o erro número um de quem começa: use{" "}
            <code>formatUnits</code> para exibir e <code>parseUnits</code> para enviar.
          </p>
          <Codigo>{`const contrato = new ethers.Contract(endereco, ABI, provider);
const [nome, simbolo, casas] = await Promise.all([
  contrato.name(), contrato.symbol(), contrato.decimals(),
]);
const bruto = await contrato.balanceOf(conta);
const saldo = ethers.formatUnits(bruto, casas); // "12.5"

// para enviar 12.5 tokens:
const valor = ethers.parseUnits("12.5", casas);`}</Codigo>
        </section>
      </div>
    ),
  },
  {
    id: 4,
    title: "Escrevendo: transfer e approve",
    subtitle: "Assinar, esperar, tratar erro",
    minutes: 34,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.1 — o ciclo de uma transação</h3>
          <p className="leading-relaxed">
            Toda escrita tem três fases: <strong>assinar</strong> (carteira),{" "}
            <strong>transmitir</strong> (rede) e <strong>confirmar</strong> (bloco). A UI precisa
            mostrar as três — botão que fica igual durante 20 segundos faz o usuário clicar duas
            vezes e pagar duas taxas.
          </p>
          <Codigo>{`const contratoComSigner = contrato.connect(signer);
const tx = await contratoComSigner.transfer(destino, valor); // 1 e 2
setStatus("minerando...");
const recibo = await tx.wait();                            // 3
if (recibo.status !== 1) throw new Error("transação revertida");
setStatus("confirmada");`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.2 — erros que o usuário causa (e não são bug)</h3>
          <p className="leading-relaxed">
            <code>ACTION_REJECTED</code> é o usuário fechando a carteira. <code>INSUFFICIENT_FUNDS</code>{" "}
            é saldo de ETH insuficiente para o gas — não é saldo de token. Tratar essas duas
            mensagens separadamente evita alerta vermelho para quem só desistiu.
          </p>
          <Codigo>{`try {
  const tx = await contratoComSigner.transfer(destino, valor);
  await tx.wait();
} catch (e: any) {
  if (e.code === "ACTION_REJECTED") return setAviso("Você cancelou na carteira.");
  if (e.code === "INSUFFICIENT_FUNDS")
    return setAviso("Falta ETH para a taxa de rede (gas), não é o token.");
  setAviso(e.shortMessage ?? "Falha ao enviar.");
}`}</Codigo>
          <Bloco>
            <strong className="text-blue-300">approve ≠ transfer:</strong> <code>approve</code>{" "}
            autoriza outro contrato (um DEX, por exemplo) a gastar seus tokens. Para mandar token
            direto para uma pessoa, é <code>transfer</code>.
          </Bloco>
        </section>
      </div>
    ),
  },
  {
    id: 5,
    title: "Do local para produção",
    subtitle: "Build, Vercel e leitura sem carteira",
    minutes: 26,
    content: (
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.1 — visitante sem MetaMask</h3>
          <p className="leading-relaxed">
            A maior parte de quem abre seu site não tem carteira instalada. Se a página quebrar
            sem <code>window.ethereum</code>, você perde a visita. Leia o contrato por RPC público
            e só exija a carteira no momento de assinar.
          </p>
          <Codigo>{`const providerLeitura = window.ethereum
  ? new ethers.BrowserProvider(window.ethereum)
  : new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);

// leitura funciona nos dois casos; escrita exige signer
const contrato = new ethers.Contract(endereco, ABI, providerLeitura);`}</Codigo>
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.2 — deploy e verificação</h3>
          <p className="leading-relaxed">
            Na Vercel, as variáveis <code>NEXT_PUBLIC_*</code> precisam existir em{" "}
            <strong>Production e Preview</strong> — variável só em Production faz o preview do PR
            abrir sem contrato. Depois do deploy, confira no console do navegador se o endereço
            carregou e faça uma leitura real antes de anunciar o link.
          </p>
          <Codigo>{`npm run build     # quebra aqui = não sobe
vercel --prod     # ou push na main, com as envs já cadastradas`}</Codigo>
          <Bloco>
            <strong className="text-blue-300">Checklist de entrega:</strong> build local passa,
            preview do PR lê o contrato, MetaMask em Sepolia conecta, transferência de teste
            confirmada e link do Etherscan com status <code>Success</code>.
          </Bloco>
        </section>
      </div>
    ),
  },
];
