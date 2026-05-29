'use client';

import { useState, useEffect } from 'react';

const MODULES = [
  {
    id: 1,
    title: 'Fundamentos de Blockchain',
    subtitle: 'A base de tudo',
    minutes: 18,
    content: (
      <div className="space-y-8">
        {/* O que é blockchain */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.1 — O que é Blockchain?</h3>
          <p className="leading-relaxed">
            Imagine um caderno compartilhado, onde cada página registra todas as transações de uma comunidade. 
            Esse caderno não está guardado na gaveta de uma única pessoa — ele é copiado e mantido 
            simultaneamente por milhares de computadores ao redor do mundo. Todo mundo tem a mesma versão, 
            e qualquer tentativa de adulterar uma página antiga é imediatamente percebida porque o restante 
            da rede tem a cópia correta. Essa é a essência do blockchain: <strong>um livro-razão distribuído, 
            imutável e transparente</strong>.
          </p>
          <p className="leading-relaxed">
            O termo &ldquo;blockchain&rdquo; vem da estrutura dos dados: transações são agrupadas em 
            <strong> blocos</strong>, e cada bloco é ligado criptograficamente ao anterior, formando uma 
            corrente (<em>chain</em>). Se alguém tenta modificar um bloco antigo, o hash desse bloco muda, 
            quebrando a ligação com todos os blocos seguintes — e a rede inteira rejeita a alteração.
          </p>
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-4 text-sm">
            <strong className="text-blue-300">📘 Conceito-chave:</strong>{' '}
            Blockchain elimina a necessidade de intermediários de confiança (bancos, cartórios) porque 
            a confiança está no código e no consenso da rede, não em uma instituição.
          </div>
        </section>

        {/* Consenso */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.2 — Como Funciona o Consenso (PoW vs PoS)</h3>
          <p className="leading-relaxed">
            Em uma rede descentralizada, não há um servidor central decidindo qual transação é válida. 
            Em vez disso, os participantes da rede (chamados <strong>nós</strong>) precisam <em>entrar em 
            acordo</em> sobre o estado do livro-razão. Esse acordo é chamado de <strong>mecanismo de 
            consenso</strong>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-lg p-4">
              <h4 className="font-bold text-yellow-400 mb-2">⛏️ Prova de Trabalho (PoW)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Usado pelo Bitcoin e Ethereum (antes da fusão). Mineradores competem para resolver um 
                quebra-cabeça matemático. O primeiro a encontrar a solução propõe o próximo bloco e ganha 
                uma recompensa. Consome muita energia elétrica, mas é extremamente seguro.
              </p>
            </div>
            <div className="bg-purple-950/20 border border-purple-900/40 rounded-lg p-4">
              <h4 className="font-bold text-purple-400 mb-2">💎 Prova de Participação (PoS)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Usado pelo Ethereum atual. Validadores &ldquo;travam&rdquo; (stake) seus próprios ETH como 
                garantia. Se tentarem agir de forma desonesta, perdem o ETH depositado (slashing). É muito 
                mais eficiente energeticamente.
              </p>
            </div>
          </div>
        </section>

        {/* Bloco e transação */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.3 — O que é um Bloco e uma Transação</h3>
          <p className="leading-relaxed">
            Uma <strong>transação</strong> é a menor unidade de operação no blockchain: enviar ETH para 
            alguém, interagir com um contrato inteligente, ou criar um novo token. Cada transação contém 
            remetente, destinatário, valor, nonce (contador de transações da carteira) e dados adicionais.
          </p>
          <p className="leading-relaxed">
            Um <strong>bloco</strong> é um pacote que contém várias transações, junto com metadados: 
            timestamp, hash do bloco anterior, hash do próprio bloco, e o número do bloco (height). 
            A cada ~12 segundos na Ethereum, um novo bloco é adicionado à corrente.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`Bloco #19.250.000
├── Hash: 0x7c3f...a9b2
├── Hash anterior: 0x4e1a...f83d
├── Timestamp: 1700000000
├── Transações:
│   ├── Tx 1: Alice → Bob (0.5 ETH)
│   ├── Tx 2: Charlie → Dave (120 USDC)
│   └── Tx 3: Interação com contrato 0x...
└── Recompensa do validador: 0.01 ETH`}
          </pre>
        </section>

        {/* Chaves pública e privada */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.4 — Chave Pública vs Privada</h3>
          <p className="leading-relaxed">
            A criptografia de <strong>chave pública/privada</strong> é o que garante a segurança e 
            propriedade no blockchain. Pense na <strong>chave pública</strong> como seu endereço de e-mail: 
            você pode compartilhá-lo com qualquer um para receber mensagens (ou tokens). Já a{' '}
            <strong>chave privada</strong> é a senha do seu e-mail: só você deve conhecê-la, e quem a 
            possui tem controle total sobre os ativos da carteira.
          </p>
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4 text-sm">
            <strong className="text-red-400">⚠️ Atenção:</strong> Nunca compartilhe sua chave privada! 
            Não existe &ldquo;esqueci minha senha&rdquo; no blockchain. Se você perder a chave privada, 
            perde o acesso aos seus fundos para sempre. Guarde-a em local seguro, de preferência off-line 
            (cold wallet).
          </div>
          <p className="leading-relaxed">
            A <strong>chave pública</strong> é derivada da privada através de um algoritmo matemático 
            (ECDSA no caso do Ethereum). O <strong>endereço Ethereum</strong> é simplesmente os últimos 
            20 bytes do hash da chave pública, prefixado com &ldquo;0x&rdquo;. Por isso você pode gerar 
            endereços sem nunca estar on-line — a blockchain não está envolvida na criação de carteiras.
          </p>
        </section>

        {/* Hash */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">1.5 — O que é um Hash</h3>
          <p className="leading-relaxed">
            <strong>Hash</strong> é uma função matemática que transforma qualquer entrada (um texto, 
            um arquivo, uma transação) em uma sequência de caracteres de tamanho fixo. No Ethereum, 
            usamos o algoritmo <strong>keccak256</strong>, que produz 64 caracteres hexadecimais (32 bytes).
          </p>
          <p className="leading-relaxed">
            Propriedades fundamentais de um bom hash:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Determinístico:</strong> a mesma entrada sempre produz o mesmo hash.</li>
            <li><strong>Rápido de calcular:</strong> computar o hash de um bloco leva microssegundos.</li>
            <li><strong>Impossível de reverter:</strong> dado um hash, é computacionalmente inviável 
            descobrir a entrada original (one-way function).</li>
            <li><strong>Avalanche effect:</strong> mudar um único bit na entrada muda completamente o hash 
            de saída.</li>
          </ul>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`hash("Olá, mundo!")   → 0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44df58d91a8c4d
hash("Olá, mundo.")  → 0x3b63018e37dbf21ae7849b32c5b653f930083dc47ac1ca00f4e6b464ccf62f4f
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    Mesmo com 1 caractere de diferença, o hash é completamente diferente`}
          </pre>
        </section>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Ethereum e Smart Contracts',
    subtitle: 'A camada de programação',
    minutes: 15,
    content: (
      <div className="space-y-8">
        {/* O que é Ethereum */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.1 — O que é Ethereum?</h3>
          <p className="leading-relaxed">
            Enquanto o Bitcoin foi criado para ser uma <strong>moeda digital peer-to-peer</strong>, a 
            Ethereum foi concebida como um <strong>computador mundial descentralizado</strong>. 
            A grande inovação do Ethereum é a capacidade de executar código arbitrário na blockchain — 
            não apenas transferir valor. Esse código é imutável, transparente e executado por milhares de 
            nós simultaneamente.
          </p>
          <p className="leading-relaxed">
            Enquanto no Bitcoin você só pode enviar BTC de uma carteira para outra, no Ethereum você pode 
            criar contratos que gerenciam tokens, empréstimos, leilões, jogos, organizações inteiras 
            (DAOs) e muito mais. É por isso que dizemos que o Ethereum é <strong>programável</strong>.
          </p>
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-4 text-sm">
            <strong className="text-blue-300">📘 Conceito-chave:</strong> A Ethereum não é &ldquo;o 
            Bitcoin com contratos&rdquo; — é uma plataforma de computação descentralizada que tem seu 
            próprio ativo nativo (ETH) para pagar pela execução dos programas.
          </div>
        </section>

        {/* EVM */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.2 — EVM (Ethereum Virtual Machine)</h3>
          <p className="leading-relaxed">
            A <strong>Ethereum Virtual Machine (EVM)</strong> é o ambiente de execução dos smart contracts 
            na rede Ethereum. Pense na EVM como uma máquina virtual distribuída — todo nó da rede executa 
            o mesmo código e chega ao mesmo resultado, garantindo consenso não apenas sobre saldos, mas 
            sobre o estado completo de todos os contratos.
          </p>
          <p className="leading-relaxed">
            A EVM é <strong>Turing-completa</strong>, o que significa que pode executar qualquer algoritmo 
            computacional. No entanto, há um limite prático: o <strong>gas</strong>, que impede loops 
            infinitos e abusos de recursos. Cada operação na EVM tem um custo em gas, e quando o gas 
            acaba, a execução para.
          </p>
          <p className="leading-relaxed">
            Uma consequência importante: blockchains compatíveis com EVM (como Polygon, BNB Chain, 
            Avalanche C-Chain, Arbitrum, Optimism) podem rodar os mesmos contratos Solidity com 
            adaptações mínimas — daí o ecossistema &ldquo;EVM-compatible&rdquo; ser tão grande.
          </p>
        </section>

        {/* Smart Contracts */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.3 — O que são Smart Contracts</h3>
          <p className="leading-relaxed">
            Um <strong>smart contract</strong> (contrato inteligente) é um programa que vive na 
            blockchain e é executado automaticamente quando condições pré-definidas são atendidas. 
            Não é um contrato jurídico no sentido tradicional — é código que <strong>não pode ser 
            parado ou modificado</strong> depois de implantado (a menos que tenha funções de upgrade).
          </p>
          <p className="leading-relaxed">Analogias úteis:</p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Máquina de venda automática:</strong> você insere moedas, escolhe um produto, e a máquina libera o item — sem precisar de um vendedor.</li>
            <li><strong>Escrow automático:</strong> duas partes depositam fundos, e quando ambas confirmam, o contrato libera o pagamento automaticamente.</li>
            <li><strong>Robô imutável:</strong> uma vez ligado, ninguém pode desligá-lo ou alterar suas regras.</li>
          </ul>
        </section>

        {/* Gas */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.4 — Gas, Taxas e Gwei</h3>
          <p className="leading-relaxed">
            <strong>Gas</strong> é a unidade que mede o esforço computacional necessário para executar 
            uma operação na EVM. Cada operação (soma, armazenamento, chamada externa) consome uma 
            quantidade fixa de gas. O <strong>preço do gas</strong> é quanto você está disposto a pagar 
            por unidade de gas, geralmente medido em <strong>Gwei</strong> (1 Gwei = 10⁻⁹ ETH = 
            0,000000001 ETH).
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`Taxa total = Gas usado × Preço do gas (em Gwei)

Exemplo:
  Gas usado:      21.000 (envio simples de ETH)
  Preço do gas:   25 Gwei
  Taxa total:     21.000 × 25 = 525.000 Gwei = 0,000525 ETH`}
          </pre>
          <p className="leading-relaxed">
            O <strong>limit de gas</strong> é o máximo de gas que você está disposto a gastar em uma 
            transação. Se o limit for muito baixo, a transação falha (mas você paga pelo trabalho já 
            feito!). Transações mais complexas, como interagir com contratos, podem consumir 100.000 gas 
            ou mais.
          </p>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">💡 Dica:</strong> Redes alternativas como Polygon, 
            Arbitrum e Optimism têm taxas drasticamente menores por usarem soluções de Layer 2 ou 
            blockchains paralelos. Para aprendizado, comece por elas ou pela Sepolia testnet.
          </div>
        </section>

        {/* EOA vs Contratos */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">2.5 — Contas EOA vs Contratos</h3>
          <p className="leading-relaxed">
            No Ethereum, existem dois tipos de contas:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-4">
              <h4 className="font-bold text-emerald-400 mb-2">👤 EOA (Externally Owned Account)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Controlada por uma chave privada. Pode iniciar transações, enviar ETH e interagir com 
                contratos. É o tipo de conta que você cria na MetaMask. Identificada por um endereço 
                de 40 caracteres hexadecimais.
              </p>
            </div>
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4">
              <h4 className="font-bold text-amber-400 mb-2">🤖 Contrato Inteligente</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Não possui chave privada. É controlado unicamente pelo código do contrato e não pode 
                iniciar transações por conta própria — precisa ser chamado por uma EOA ou outro 
                contrato. Tem endereço próprio e pode armazenar ETH e tokens.
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Solidity na Prática',
    subtitle: 'Escrevendo seu primeiro contrato',
    minutes: 22,
    content: (
      <div className="space-y-8">
        {/* Introdução ao Solidity */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.1 — Introdução ao Solidity</h3>
          <p className="leading-relaxed">
            <strong>Solidity</strong> é a linguagem de programação mais popular para escrever smart 
            contracts na EVM. Criada em 2014 pelo time do Ethereum, sua sintaxe é inspirada em C++, 
            Python e JavaScript. É uma linguagem <strong>estaticamente tipada</strong>, compilada para 
            bytecode EVM.
          </p>
          <p className="leading-relaxed">
            Um contrato Solidity começa com a diretiva <code className="text-blue-300">pragma solidity</code>, 
            que define a versão do compilador. Todo contrato é como uma classe em OOP: tem variáveis de 
            estado, funções, modifiers, eventos e pode herdar de outros contratos.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MeuPrimeiroContrato {
    string public saudacao = "Olá, mundo!";
    
    function definirSaudacao(string memory _saudacao) public {
        saudacao = _saudacao;
    }
}`}
          </pre>
        </section>

        {/* Tipos de dados, funções, modifiers */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.2 — Tipos de Dados, Funções e Modifiers</h3>
          <p className="leading-relaxed">
            <strong>Tipos básicos:</strong> <code className="text-blue-300">uint</code> (inteiro sem 
            sinal), <code className="text-blue-300">int</code>, <code className="text-blue-300">bool</code>, 
            <code className="text-blue-300">address</code>, <code className="text-blue-300">string</code>, 
            <code className="text-blue-300">bytes</code>. Arrays e mappings são tipos de dados 
            compostos fundamentais para contratos ERC20.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// Mapeamento: endereço → saldo (base do ERC20)
mapping(address => uint256) private _balances;

// Array dinâmico de endereços
address[] public holders;

// Struct personalizada
struct Voto {
    address voter;
    uint256 weight;
    bool approved;
}`}
          </pre>
          <p className="leading-relaxed">
            <strong>Modifiers</strong> são blocos de código reutilizáveis que podem ser executados antes 
            de uma função. O exemplo clássico é o <code className="text-blue-300">onlyOwner</code> do 
            OpenZeppelin: só permite que o dono do contrato execute determinada ação.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

function cunhar(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
}`}
          </pre>
        </section>

        {/* ERC20 */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.3 — ERC20: O Padrão de Tokens</h3>
          <p className="leading-relaxed">
            O <strong>ERC20 (Ethereum Request for Comments 20)</strong> é o padrão técnico para tokens 
            fungíveis na Ethereum. Um token fungível significa que cada unidade é idêntica e 
            intercambiável — como dinheiro: qualquer nota de R$10 vale o mesmo que outra nota de R$10.
          </p>
          <p className="leading-relaxed">
            A especificação ERC20 define seis funções obrigatórias e dois eventos que todo contrato de 
            token deve implementar:
          </p>
          <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 text-sm space-y-2 font-mono">
            <p><span className="text-blue-400">totalSupply()</span> → uint256 — total de tokens existentes</p>
            <p><span className="text-blue-400">balanceOf(address)</span> → uint256 — saldo de um endereço</p>
            <p><span className="text-blue-400">transfer(address, uint256)</span> → bool — transfere tokens</p>
            <p><span className="text-blue-400">allowance(address, address)</span> → uint256 — limite de gasto delegado</p>
            <p><span className="text-blue-400">approve(address, uint256)</span> → bool — autoriza gasto</p>
            <p><span className="text-blue-400">transferFrom(address, address, uint256)</span> → bool — transferência delegada</p>
            <p className="text-yellow-400">event Transfer(address indexed from, address indexed to, uint256 value)</p>
            <p className="text-yellow-400">event Approval(address indexed owner, address indexed spender, uint256 value)</p>
          </div>
        </section>

        {/* OpenZeppelin */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.4 — OpenZeppelin: Por Que Usar Biblioteca Testada</h3>
          <p className="leading-relaxed">
            Escrever um contrato ERC20 do zero é possível, mas <strong>arriscado</strong>. Um erro 
            sutil de aritmética, um descuido com permissões ou uma vulnerabilidade de reentrância pode 
            custar milhões de dólares. É aí que entra o <strong>OpenZeppelin</strong>.
          </p>
          <p className="leading-relaxed">
            OpenZeppelin é a biblioteca padrão da indústria para desenvolvimento seguro de smart 
            contracts. Ela oferece implementações auditadas e testadas dos padrões mais comuns 
            (ERC20, ERC721, ERC1155, Ownable, AccessControl, Pausable, etc.). Milhares de projetos 
            com bilhões de dólares em valor usam OpenZeppelin.
          </p>
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-4 text-sm">
            <strong className="text-emerald-400">✅ Boa prática:</strong> Sempre prefira bibliotecas 
            auditadas a implementações caseiras. OpenZeppelin é mantida pela comunidade, passa por 
            auditorias regulares e é referência de segurança. Você ainda pode estender as funcionalidades 
            com herança.
          </div>
        </section>

        {/* TestToken linha por linha */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.5 — O Contrato TestToken Explicado</h3>
          <p className="leading-relaxed">
            No ERC20 Token Lab, o contrato principal é o <strong>TestToken.sol</strong>. Vamos analisar 
            cada parte:
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";`}
          </pre>
          <p className="text-sm text-neutral-400">
            Importamos três contratos do OpenZeppelin: ERC20 (padrão), ERC20Burnable (adiciona 
            função burn) e Ownable (controle de acesso com onlyOwner).
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`contract TestToken is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner)
        ERC20("TestToken", "TST")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }
}`}
          </pre>
          <p className="text-sm text-neutral-400">
            O contrato <strong>herda</strong> de três contratos (herança múltipla). O construtor 
            recebe o endereço do dono inicial, define nome &ldquo;TestToken&rdquo; e símbolo &ldquo;TST&rdquo;, 
            e já cunha 1 milhão de tokens para o dono (considerando 18 casas decimais, o padrão).
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
}`}
          </pre>
          <p className="text-sm text-neutral-400">
            A função <code className="text-blue-300">mint</code> é pública mas só pode ser chamada 
            pelo dono (graças ao modifier <code className="text-blue-300">onlyOwner</code>). Ela 
            usa a função interna <code className="text-blue-300">_mint</code> do ERC20 para criar 
            novos tokens.
          </p>
        </section>

        {/* Herança */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">3.6 — Herança: ERC20, ERC20Burnable, Ownable</h3>
          <p className="leading-relaxed">
            A <strong>herança</strong> em Solidity permite que um contrato estenda funcionalidades de 
            outros contratos, similar à herança em programação orientada a objetos. No TestToken, 
            usamos três contratos base:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>ERC20:</strong> implementa todo o padrão — balances, totalSupply, transfer, 
            approve, transferFrom, eventos Transfer e Approval.</li>
            <li><strong>ERC20Burnable:</strong> adiciona as funções <code className="text-blue-300">burn()</code> 
            e <code className="text-blue-300">burnFrom()</code> que permitem destruir tokens, 
            reduzindo o totalSupply.</li>
            <li><strong>Ownable:</strong> fornece o modifier <code className="text-blue-300">onlyOwner</code>, 
            a função <code className="text-blue-300">transferOwnership()</code> e o evento 
            <code className="text-blue-300">OwnershipTransferred</code>.</li>
          </ul>
          <p className="leading-relaxed">
            Essa abordagem <strong>composicional</strong> é o padrão de mercado: em vez de escrever 
            tudo do zero, você combina componentes testados e auditados como blocos de montar. Isso 
            reduz drasticamente a superfície de ataque e acelera o desenvolvimento.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Hardhat',
    subtitle: 'O ambiente de desenvolvimento',
    minutes: 15,
    content: (
      <div className="space-y-8">
        {/* O que é Hardhat */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.1 — O que é Hardhat</h3>
          <p className="leading-relaxed">
            <strong>Hardhat</strong> é o ambiente de desenvolvimento mais utilizado para smart 
            contracts em Ethereum. Ele oferece tudo que um desenvolvedor precisa: compilação, deploy, 
            testes, depuração e uma rede local para desenvolvimento. Sucessor do Truffle, o Hardhat 
            se destaca pela flexibilidade, velocidade e pela <strong>Hardhat Network</strong> — uma 
            rede local que suporta debug de transações com stack traces completos.
          </p>
          <p className="leading-relaxed">
            Hardhat é extensível via plugins: Hardhat Toolbox (conjunto padrão com ethers, 
            chai, mocha, Solhint), hardhat-etherscan (verificação de contratos), hardhat-gas-reporter 
            (relatório de gas) e muitos outros.
          </p>
        </section>

        {/* Setup do ambiente */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.2 — Setup do Ambiente</h3>
          <p className="leading-relaxed">
            Para iniciar um projeto Hardhat:
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`mkdir meu-token && cd meu-token
npm init -y
npm install --save-dev hardhat
npx hardhat init`}
          </pre>
          <p className="leading-relaxed">
            O comando <code className="text-blue-300">npx hardhat init</code> cria uma estrutura de 
            diretórios padrão:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-neutral-300 text-sm font-mono">
            <li><span className="text-blue-300">contracts/</span> — seus contratos Solidity</li>
            <li><span className="text-blue-300">scripts/</span> — scripts de deploy e automação</li>
            <li><span className="text-blue-300">test/</span> — testes unitários</li>
            <li><span className="text-blue-300">hardhat.config.js</span> — configuração do projeto</li>
          </ul>
          <p className="leading-relaxed mt-2">
            O arquivo <code className="text-blue-300">hardhat.config.ts</code> é o coração do projeto. 
            É nele que você define a versão do Solidity, as redes (local, testnet, mainnet), as 
            contas (via variáveis de ambiente) e os plugins.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: \`https://sepolia.infura.io/v3/\${process.env.INFURA_API_KEY}\`,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};

export default config;`}
          </pre>
        </section>

        {/* Scripts de deploy */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.3 — Scripts de Deploy</h3>
          <p className="leading-relaxed">
            O deploy de um contrato é feito através de scripts JavaScript/TypeScript que o Hardhat 
            executa. O padrão é usar <code className="text-blue-300">hardhat-ignition</code> (módulo 
            declarativo) ou scripts manuais com ethers.js.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Implantando com:", owner.address);

  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy(owner.address);
  await token.waitForDeployment();

  console.log("TestToken implantado em:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`}
          </pre>
          <p className="leading-relaxed">
            Execute com: <code className="text-blue-300">npx hardhat run scripts/deploy.ts --network sepolia</code>. 
            Se omitir <code className="text-blue-300">--network</code>, o deploy será na rede local.
          </p>
        </section>

        {/* Testes unitários */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.4 — Testes Unitários</h3>
          <p className="leading-relaxed">
            Hardhat usa <strong>Mocha</strong> como framework de testes e <strong>Chai</strong> para 
            asserções, com plugins adicionais como <code className="text-blue-300">chai-ethers</code> 
            e <code className="text-blue-300">hardhat-gas-reporter</code>. Testes são escritos em 
            TypeScript e executados na Hardhat Network, que é extremamente rápida por ser local.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`import { expect } from "chai";
import { ethers } from "hardhat";

describe("TestToken", function () {
  it("deve cunhar tokens para o dono", async function () {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy(owner.address);
    
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseUnits("1000000", 18));
  });
});`}
          </pre>
          <p className="leading-relaxed">
            Execute os testes com: <code className="text-blue-300">npx hardhat test</code>. O relatório 
            mostra quantos testes passaram, tempo de execução e, se configurado, o custo de gas de 
            cada operação.
          </p>
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-4 text-sm">
            <strong className="text-emerald-400">✅ Boa prática:</strong> Todo contrato em produção 
            deve ter cobertura de testes próxima de 100%. Teste não apenas o caminho feliz, mas 
            também as bordas: transferir mais do que o saldo, chamar funções sem permissão, etc.
          </div>
        </section>

        {/* Rede local */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">4.5 — Rede Local</h3>
          <p className="leading-relaxed">
            Hardhat inclui uma <strong>rede local</strong> (Hardhat Network) que você inicia com 
            <code className="text-blue-300">npx hardhat node</code>. Ela cria 20 contas de teste com 
            10.000 ETH falsos cada — perfeito para desenvolvimento e testes manuais.
          </p>
          <p className="leading-relaxed">
            A rede local é <strong>determinística</strong>: as mesmas contas são criadas todas as 
            vezes (a menos que você configure um seed diferente). Você pode conectar a MetaMask a 
            ela (RPC: <code className="text-blue-300">http://127.0.0.1:8545</code>, Chain ID: 31337) 
            e interagir com seus contratos como se estivesse na mainnet, mas sem gastar dinheiro real.
          </p>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">💡 Dica:</strong> Após iniciar o node, mantenha o 
            terminal aberto. Em outro terminal, use <code className="text-blue-300">npx hardhat run scripts/deploy.ts</code> 
            para implantar na rede local. O endereço do contrato aparecerá no console.
          </div>
        </section>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Frontend Web3',
    subtitle: 'Conectando o usuário à blockchain',
    minutes: 20,
    content: (
      <div className="space-y-8">
        {/* Next.js + Ethers.js */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.1 — Next.js + Ethers.js</h3>
          <p className="leading-relaxed">
            O <strong>ERC20 Token Lab</strong> usa <strong>Next.js 16</strong> como framework React 
            para o frontend e <strong>ethers.js</strong> como biblioteca de interação com a blockchain. 
            Ethers.js é a biblioteca mais popular para conectar aplicações web ao Ethereum, oferecendo 
            uma API limpa e segura para enviar transações, ler dados de contratos e gerenciar carteiras.
          </p>
          <p className="leading-relaxed">
            Ethers.js se destaca por:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Segurança:</strong> chaves privadas nunca saem do cliente.</li>
            <li><strong>Leveza:</strong> comparado ao web3.js, é menor e mais modular.</li>
            <li><strong>TypeScript:</strong> tipagem completa, com tipos para todos os contratos ERC20.</li>
            <li><strong>Human-readable ABI:</strong> você pode usar a interface do contrato em formato legível.</li>
          </ul>
        </section>

        {/* window.ethereum e MetaMask */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.2 — window.ethereum e MetaMask</h3>
          <p className="leading-relaxed">
            A <strong>MetaMask</strong> é a carteira mais usada no ecossistema Web3. Quando instalada, 
            ela injeta um objeto <code className="text-blue-300">window.ethereum</code> no navegador, 
            que é um <strong>Provider</strong> (conexão com a rede) e um <strong>Signer</strong> 
            (carteira que pode assinar transações).
          </p>
          <p className="leading-relaxed">
            Para verificar se a MetaMask está instalada:
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`if (typeof window.ethereum !== "undefined") {
  console.log("MetaMask instalada!");
} else {
  console.log("Instale a MetaMask: https://metamask.io");
}`}
          </pre>
          <p className="leading-relaxed">
            Para conectar a carteira do usuário (solicitar acesso às contas):
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`const accounts = await window.ethereum.request({
  method: "eth_requestAccounts",
});
const userAddress = accounts[0];`}
          </pre>
        </section>

        {/* Provider, Signer, Contract */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.3 — Provider, Signer, Contract</h3>
          <p className="leading-relaxed">
            No ethers.js, três objetos são fundamentais:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-2 text-sm">🔌 Provider</h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Conexão apenas de leitura com a blockchain. Usado para consultar saldos, ler dados de 
                contratos, obter logs de eventos. Não pode enviar transações.
              </p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-2 text-sm">✍️ Signer</h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Representa uma conta que pode assinar transações. No navegador, o Signer é obtido da 
                MetaMask via <code className="text-blue-300">getSigner()</code>.
              </p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-2 text-sm">📜 Contract</h4>
              <p className="text-xs leading-relaxed text-neutral-400">
                Objeto que conecta um endereço de contrato + ABI a um Provider (leitura) ou Signer 
                (escrita). Permite chamar funções como métodos JavaScript.
              </p>
            </div>
          </div>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// Provider (leitura)
const provider = new ethers.BrowserProvider(window.ethereum);

// Signer (escrita — precisa de aprovação do usuário)
const signer = await provider.getSigner();

// Contract conectado ao signer (para escrever)
const token = new ethers.Contract(
  tokenAddress,
  abi,
  signer
);
const tx = await token.transfer("0x...", amount);`}
          </pre>
        </section>

        {/* Web3Context */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.4 — Web3Context: Estado Global da Carteira</h3>
          <p className="leading-relaxed">
            Gerenciar o estado da carteira (conectado, desconectado, endereço, rede, saldo) de forma 
            global é essencial. No ERC20 Token Lab, usamos o <strong>React Context API</strong> 
            para criar um <code className="text-blue-300">Web3Context</code> que expõe esses dados 
            para toda a aplicação.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  tokenContract: Contract | null;
}`}
          </pre>
          <p className="leading-relaxed">
            O contexto também monitora mudanças de conta e rede na MetaMask via listeners de eventos 
            (<code className="text-blue-300">accountsChanged</code>, <code className="text-blue-300">chainChanged</code>), 
            mantendo a UI sempre sincronizada.
          </p>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">💡 Dica:</strong> Sempre trate o caso de o usuário 
            trocar de rede ou desconectar a carteira. Uma boa experiência do usuário (UX) em Web3 
            inclui feedback claro: &ldquo;Conecte sua carteira&rdquo;, &ldquo;Rede incorreta&rdquo;, 
            &ldquo;Transação confirmada&rdquo;.
          </div>
        </section>

        {/* Funções de leitura vs escrita */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.5 — Funções de Leitura vs Escrita</h3>
          <p className="leading-relaxed">
            Uma distinção crucial no ethers.js (e na EVM) é entre funções de <strong>leitura</strong> 
            (que não alteram o estado) e funções de <strong>escrita</strong> (que criam transações).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-2 text-sm">📖 Funções de Leitura (call)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Não custam gas. Não precisam de assinatura. Retornam dados instantaneamente. 
                Exemplos: <code className="text-blue-300">balanceOf()</code>, 
                <code className="text-blue-300">totalSupply()</code>, <code className="text-blue-300">name()</code>. 
                São chamadas com <code className="text-blue-300">await token.balanceOf(addr)</code>.
              </p>
            </div>
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4">
              <h4 className="font-bold text-amber-400 mb-2 text-sm">✍️ Funções de Escrita (send)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                Custam gas. Precisam de assinatura da MetaMask. São transações que modificam o estado 
                da blockchain. Exemplos: <code className="text-blue-300">transfer()</code>, 
                <code className="text-blue-300">approve()</code>, <code className="text-blue-300">mint()</code>. 
                Retornam um objeto TransactionResponse.
              </p>
            </div>
          </div>
        </section>

        {/* ABI */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">5.6 — ABI: O que é e para que serve</h3>
          <p className="leading-relaxed">
            <strong>ABI (Application Binary Interface)</strong> é o &ldquo;manual de instruções&rdquo; 
            de um contrato inteligente. É um JSON que descreve todas as funções, eventos, parâmetros 
            e tipos de retorno do contrato. Sem a ABI, o ethers.js não sabe como codificar ou 
            decodificar as chamadas ao contrato.
          </p>
          <p className="leading-relaxed">
            Quando você compila um contrato com Hardhat, a ABI é gerada automaticamente na pasta 
            <code className="text-blue-300">artifacts/</code>. Você copia essa ABI (ou apenas as 
            funções que precisa) para o frontend.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// Exemplo simplificado de ABI
const abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];`}
          </pre>
          <p className="leading-relaxed">
            No ethers.js v6+, você pode usar a ABI no formato <strong>human-readable</strong> (como 
            acima), que é mais legível e mais fácil de manter do que o JSON completo.
          </p>
        </section>
      </div>
    ),
  },
  {
    id: 6,
    title: 'Deploy em Testnet/Mainnet',
    subtitle: 'Do local para o mundo real',
    minutes: 15,
    content: (
      <div className="space-y-8">
        {/* Sepolia vs Mainnet */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">6.1 — Sepolia vs Mainnet</h3>
          <p className="leading-relaxed">
            Antes de colocar um contrato em produção (mainnet), você testa em uma <strong>testnet</strong> 
            — uma rede idêntica à mainnet mas com moedas sem valor real. A <strong>Sepolia</strong> é 
            a testnet recomendada atualmente pela Ethereum Foundation (a Goerli foi descontinuada).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-4">
              <h4 className="font-bold text-emerald-400 mb-2">🧪 Sepolia (Testnet)</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                ETH de teste gratuito via faucets.<br />
                Transações reais mas sem valor financeiro.<br />
                Ideal para testes, aprendizado e portfólio.<br />
                Chain ID: 11155111
              </p>
            </div>
            <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-2">🔴 Ethereum Mainnet</h4>
              <p className="text-sm leading-relaxed text-neutral-300">
                ETH real com valor de mercado.<br />
                Cada transação custa dinheiro de verdade.<br />
                Erros em contratos podem custar milhões.<br />
                Chain ID: 1
              </p>
            </div>
          </div>
        </section>

        {/* Obtendo ETH de teste */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">6.2 — Obtendo ETH de Teste (Faucets)</h3>
          <p className="leading-relaxed">
            Para interagir com a Sepolia, você precisa de ETH de teste. Os <strong>faucets</strong> 
            são sites que distribuem ETH gratuito para endereços de testnet. Alguns confiáveis:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Alchemy Sepolia Faucet:</strong> faucet.sepolia.io — requer login gratuito no Alchemy</li>
            <li><strong>Infura Faucet:</strong> infura.io/faucet/sepolia</li>
            <li><strong>Coinbase Wallet Faucet:</strong> coinbase.com/faucet</li>
          </ul>
          <p className="leading-relaxed">
            Geralmente você recebe entre 0.1 e 1 ETH de teste por dia, o que é mais que suficiente 
            para dezenas de deploys e transações de teste.
          </p>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">💡 Dica:</strong> Não acumule ETH de teste — ele 
            não tem valor real. Use apenas o necessário para testar e peça mais quando acabar. 
            Alguns faucets exigem que você tenha saldo mínimo na mainnet ou uma conta no Twitter 
            para evitar bots.
          </div>
        </section>

        {/* Configurando rede no Hardhat */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">6.3 — Configurando Rede no Hardhat</h3>
          <p className="leading-relaxed">
            Para fazer deploy na Sepolia, você precisa configurar a rede no 
            <code className="text-blue-300">hardhat.config.ts</code>:
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`networks: {
  sepolia: {
    url: \`https://sepolia.infura.io/v3/\${process.env.INFURA_API_KEY}\`,
    accounts: [process.env.PRIVATE_KEY!],
  },
}`}
          </pre>
          <p className="leading-relaxed">
            O <code className="text-blue-300">INFURA_API_KEY</code> você obtém criando uma conta 
            gratuita no Infura (ou Alchemy). O <code className="text-blue-300">PRIVATE_KEY</code> é 
            a chave privada da carteira que pagará as taxas — <strong>nunca</strong> coloque isso 
            diretamente no código; use variáveis de ambiente com um arquivo <code className="text-blue-300">.env</code>.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// .env (nunca commite este arquivo!)
INFURA_API_KEY=2a3b...f9c1
PRIVATE_KEY=0xabcdef...123456
SEPOLIA_ETHERSCAN_API_KEY=your_api_key_here`}
          </pre>
        </section>

        {/* Verificação no Etherscan */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">6.4 — Verificação no Etherscan</h3>
          <p className="leading-relaxed">
            Após o deploy, é altamente recomendável <strong>verificar</strong> o contrato no 
            Etherscan. Verificação significa publicar o código fonte do seu contrato no block 
            explorer, permitindo que qualquer pessoa veja e interaja com ele diretamente pelo 
            Etherscan.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`npx hardhat verify --network sepolia <ENDERECO_DO_CONTRATO> <ARGUMENTOS_DO_CONSTRUTOR>`}
          </pre>
          <p className="leading-relaxed">
            O Etherscan então compila seu código e compara com o bytecode na blockchain. Se bater, 
            o contrato aparece com um ✅ &ldquo;Verified&rdquo; e você pode ler funções, escrever 
            transações e ver eventos diretamente pela interface do Etherscan.
          </p>
        </section>

        {/* Segurança */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">6.5 — Cuidados com Segurança</h3>
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4 space-y-2">
            <p className="text-sm"><strong className="text-red-400">🔐 Regras de Ouro:</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-300">
              <li><strong>Nunca</strong> comite sua chave privada no Git. Use .env e .gitignore.</li>
              <li><strong>Nunca</strong> compartilhe sua seed phrase da MetaMask com ninguém.</li>
              <li><strong>Sempre</strong> teste primeiro em rede local, depois em testnet, só depois em mainnet.</li>
              <li><strong>Sempre</strong> audite/revise o contrato antes do deploy em mainnet.</li>
              <li><strong>Use carteiras separadas:</strong> uma para desenvolvimento (com saldo limitado), outra para funds reais.</li>
              <li><strong>Revogue permissões</strong> de contratos não utilizados com revoke.cash ou similar.</li>
            </ul>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: 7,
    title: 'Operações Avançadas',
    subtitle: 'Mint, Burn, Approve & TransferFrom',
    minutes: 18,
    content: (
      <div className="space-y-8">
        {/* Mint */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">7.1 — Mint: Criando Novos Tokens</h3>
          <p className="leading-relaxed">
            <strong>Mint</strong> (cunhagem) é o processo de criar novos tokens do zero. No 
            TestToken, a função <code className="text-blue-300">mint(address to, uint256 amount)</code> 
            está protegida pelo modifier <code className="text-blue-300">onlyOwner</code>, ou seja, 
            apenas o dono do contrato pode criar novos tokens.
          </p>
          <p className="leading-relaxed">
            A função <code className="text-blue-300">_mint</code> (interna do OpenZeppelin) faz três 
            coisas:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-neutral-300">
            <li>Aumenta o saldo do endereço destino em <code className="text-blue-300">_balances[to] += amount</code></li>
            <li>Aumenta o <code className="text-blue-300">_totalSupply</code> em <code className="text-blue-300">amount</code></li>
            <li>Emite o evento <code className="text-blue-300">Transfer(address(0), to, amount)</code> 
            — repare que o remetente é address(0), indicando criação.</li>
          </ol>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// No frontend com ethers.js:
const tx = await tokenContract.mint(
  "0xEnderecoDoDestino",
  ethers.parseUnits("1000", 18)
);
await tx.wait();
console.log("Tokens criados com sucesso!");`}
          </pre>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">⚠️ Atenção:</strong> Mint sem limites pode causar 
            inflação e desvalorizar o token. Em projetos reais, o mint geralmente tem limites 
            (cap), requisitos ou é substituído por um cronograma de liberação (vesting schedule).
          </div>
        </section>

        {/* Burn */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">7.2 — Burn: Queimando Tokens</h3>
          <p className="leading-relaxed">
            <strong>Burn</strong> (queima) é o oposto de mint: tokens são destruídos permanentemente, 
            reduzindo o totalSupply. Isso pode ser feito para controle de inflação, recompra de 
            tokens (buyback &amp; burn), ou correção de erros.
          </p>
          <p className="leading-relaxed">
            O OpenZeppelin fornece duas funções de burn via <code className="text-blue-300">ERC20Burnable</code>:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>burn(uint256 amount):</strong> queima tokens da própria carteira de quem chama.</li>
            <li><strong>burnFrom(address account, uint256 amount):</strong> queima tokens de outra 
            conta, desde que tenha recebido allowance suficiente (approve + transferFrom).</li>
          </ul>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// O evento emitido é Transfer(account, address(0), amount)
// O endereço nulo (address(0)) significa destruição

event Transfer(address indexed from, address indexed to, uint256 value);
// Burn: from = quem perdeu os tokens, to = address(0)`}
          </pre>
        </section>

        {/* Approve */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">7.3 — Approve: Autorizando Gastos</h3>
          <p className="leading-relaxed">
            A função <code className="text-blue-300">approve</code> é uma das mais importantes do 
            ERC20. Ela permite que o dono dos tokens autorize outro endereço (<strong>spender</strong>) 
            a gastar uma quantidade específica de tokens em seu nome.
          </p>
          <p className="leading-relaxed">
            Por que isso é útil? Imagine um DEX (como Uniswap): você quer trocar Token A por Token B. 
            Você não precisa enviar os tokens para o DEX — você apenas <strong>aprova</strong> o 
            contrato do DEX a gastar seus tokens, e depois chama a função de swap. O contrato do DEX 
            usa <code className="text-blue-300">transferFrom</code> para puxar os tokens da sua conta.
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// Alice aprova o contrato do DEX a gastar 100 tokens
await token.connect(alice).approve(dexAddress, ethers.parseUnits("100", 18));

// Evento emitido:
// Approval(owner: alice, spender: dexAddress, value: 100)`}
          </pre>
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4 text-sm">
            <strong className="text-red-400">⚠️ Segurança:</strong> Cuidado com <strong>phishing de 
            approve</strong>. Sempre verifique qual contrato você está autorizando. Um approve para 
            um contrato malicioso pode drenar todos os seus tokens. Use ferramentas como 
            revoke.cash para revogar permissões suspeitas.
          </div>
        </section>

        {/* TransferFrom */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">7.4 — TransferFrom: Transferência Delegada</h3>
          <p className="leading-relaxed">
            Enquanto <code className="text-blue-300">transfer</code> envia tokens da própria carteira, 
            <code className="text-blue-300">transferFrom</code> permite que um terceiro (que foi 
            aprovado) transfira tokens de uma conta para outra.
          </p>
          <p className="leading-relaxed">
            O fluxo completo de uma transferência delegada:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-neutral-300">
            <li><strong>Owner</strong> chama <code className="text-blue-300">approve(spender, amount)</code></li>
            <li><strong>Spender</strong> chama <code className="text-blue-300">transferFrom(owner, recipient, amount)</code></li>
            <li>O contrato verifica se <code className="text-blue-300">allowance[owner][spender] &gt;= amount</code></li>
            <li>Se sim, transfere e decrementa o allowance</li>
            <li>Evento <code className="text-blue-300">Transfer(owner, recipient, amount)</code> é emitido</li>
          </ol>
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-4 text-sm">
            <strong className="text-blue-300">📘 Conceito-chave:</strong> Approve + TransferFrom é 
            o padrão que permite contratos intermediários (DEXs, bridges, yield farms) a moverem 
            tokens sem que o usuário precise fazer duas transações separadas de &ldquo;depositar e 
            depois trocar&rdquo;.
          </div>
        </section>

        {/* Eventos */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">7.5 — Eventos: Transfer e Approval</h3>
          <p className="leading-relaxed">
            <strong>Eventos</strong> em Solidity são mecanismos de logging que permitem que aplicações 
            externas (frontends, indexadores, block explorers) acompanhem o que acontece dentro de 
            um contrato, de forma eficiente e barata em termos de gas.
          </p>
          <p className="leading-relaxed">
            O ERC20 define dois eventos obrigatórios:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-yellow-400 mb-2 text-sm">🔄 Transfer</h4>
              <p className="text-xs font-mono text-neutral-400">
                event Transfer(address indexed from, address indexed to, uint256 value)
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Emitido em toda transferência de tokens — inclusive mint (from = address(0)) 
                e burn (to = address(0)).
              </p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-yellow-400 mb-2 text-sm">✅ Approval</h4>
              <p className="text-xs font-mono text-neutral-400">
                event Approval(address indexed owner, address indexed spender, uint256 value)
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Emitido quando um owner autoriza um spender a gastar tokens em seu nome.
              </p>
            </div>
          </div>
          <p className="leading-relaxed">
            No frontend, você pode &ldquo;escutar&rdquo; esses eventos para atualizar a UI em 
            tempo real, sem precisar ficar polling a blockchain:
          </p>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`tokenContract.on("Transfer", (from, to, value) => {
  console.log(\`Transferência: \${from} → \${to} = \${value}\`);
  // Atualizar saldos na UI
  refreshBalances();
});`}
          </pre>
        </section>
      </div>
    ),
  },
  {
    id: 8,
    title: 'Marketing e Monetização',
    subtitle: 'Do código ao mercado',
    minutes: 15,
    content: (
      <div className="space-y-8">
        {/* Tokenomics */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">8.1 — Tokenomics: Como Estruturar</h3>
          <p className="leading-relaxed">
            <strong>Tokenomics</strong> (token + economics) é o estudo de como um token é 
            distribuído, usado e valorizado dentro de um ecossistema. Uma tokenomics bem desenhada 
            é essencial para a sustentabilidade de longo prazo de qualquer projeto cripto.
          </p>
          <p className="leading-relaxed">Elementos fundamentais da tokenomics:</p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Supply total e circulante:</strong> Qual o máximo de tokens que existirão? 
            Há inflação programada? Tokens são queimáveis?</li>
            <li><strong>Distribuição inicial:</strong> Equipe, investidores, comunidade, tesouraria, 
            liquidity pool. Uma distribuição justa evita concentração excessiva.</li>
            <li><strong>Vesting e lockup:</strong> Tokens da equipe e investidores geralmente são 
            liberados gradualmente (ex: 4 anos com cliff de 1 ano) para evitar dump.</li>
            <li><strong>Utilidade:</strong> Para que serve o token? Governança, pagamento de taxas, 
            staking, acesso a features, recompensas?</li>
          </ul>
          <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
{`// Exemplo de distribuição (alocação)
// Total: 1.000.000.000 MYTOKEN

// 40% — Comunidade & Recompensas  (400M)
// 20% — Equipe (vesting 4 anos)   (200M)
// 15% — Investidores Anjo          (150M)
// 15% — Tesouraria do Protocolo    (150M)
// 10% — Liquidity Pool inicial     (100M)`}
          </pre>
          <div className="bg-yellow-950/30 border border-yellow-900/40 rounded-lg p-4 text-sm">
            <strong className="text-yellow-400">💡 Dica:</strong> Ferramentas como 
            <strong>TokenMint</strong>, <strong>Coingecko</strong> e <strong>Messari</strong> 
            fornecem análises de tokenomics para você se inspirar em projetos de sucesso.
          </div>
        </section>

        {/* O que atrai investidores */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">8.2 — O que Atrai Investidores</h3>
          <p className="leading-relaxed">
            Investidores em criptomoedas avaliam diversos fatores antes de aportar capital em um 
            projeto. Entender esses critérios ajuda você a estruturar melhor seu token:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-green-400 mb-2 text-sm">✅ Fatores Positivos</h4>
              <ul className="list-disc pl-4 text-xs text-neutral-400 space-y-1">
                <li>Código auditado e open-source</li>
                <li>Equipe doxxed (identidade real conhecida)</li>
                <li>Tokenomics clara e justa</li>
                <li>Produto funcional (não apenas promessa)</li>
                <li>Comunidade ativa e engajada</li>
                <li>Roadmap realista com entregas</li>
                <li>Liquidez bloqueada por longos períodos</li>
              </ul>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
              <h4 className="font-bold text-red-400 mb-2 text-sm">🚩 Bandeiras Vermelhas</h4>
              <ul className="list-disc pl-4 text-xs text-neutral-400 space-y-1">
                <li>Equipe anônima sem histórico</li>
                <li>Código não auditado</li>
                <li>Supply altamente concentrado</li>
                <li>Promessas irreais de retorno</li>
                <li>Taxas de transação obscuras</li>
                <li>Pouca ou nenhuma utilidade real</li>
                <li>Falta de transparência financeira</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Landing page do token */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">8.3 — Landing Page do Seu Token</h3>
          <p className="leading-relaxed">
            Todo token que se preza tem uma <strong>landing page</strong> profissional. Ela é o 
            cartão de visitas do projeto e geralmente contém:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li><strong>Hero section:</strong> Nome, símbolo, logotipo e value proposition em uma frase.</li>
            <li><strong>Tokenomics:</strong> Gráfico de distribuição, supply, inflação.</li>
            <li><strong>Smart contract:</strong> Endereço do contrato verificado no Etherscan com link direto.</li>
            <li><strong>Roadmap:</strong> Passado, presente e futuro do projeto.</li>
            <li><strong>Time:</strong> Quem está construindo (se aplicável).</li>
            <li><strong>Links:</strong> Etherscan, DEX (Uniswap), Twitter/X, Discord, Telegram, Medium/Gitbook.</li>
          </ul>
          <p className="leading-relaxed">
            O ERC20 Token Lab pode servir como base para sua landing page — você já tem o frontend 
            com carteira conectada, funções de mint, burn, approve e transfer. Basta personalizar 
            o design e adicionar as seções de marketing.
          </p>
        </section>

        {/* Redes sociais e comunidade */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">8.4 — Redes Sociais e Comunidade</h3>
          <p className="leading-relaxed">
            Comunidade é um dos pilares de qualquer projeto cripto. Diferente de startups 
            tradicionais, projetos Web3 frequentemente começam <strong>comunidade-first</strong>: 
            primeiro constroem uma audiência, depois lançam o produto.
          </p>
          <p className="leading-relaxed">Canais essenciais:</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-bold text-blue-400">🐦 Twitter/X</p>
              <p className="text-xs text-neutral-400 mt-1">Anúncios, threads educativas, memes, engajamento diário</p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-bold text-indigo-400">💬 Discord</p>
              <p className="text-xs text-neutral-400 mt-1">Comunidade, suporte, discussões técnicas, AMAs</p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 text-center">
              <p className="font-bold text-green-400">📝 Medium/Gitbook</p>
              <p className="text-xs text-neutral-400 mt-1">Documentação técnica, whitepaper, artigos educativos</p>
            </div>
          </div>
          <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-4 text-sm">
            <strong className="text-blue-300">📘 Estratégia:</strong> Consistência é mais importante 
            que volume. Poste 1-2 vezes por dia no Twitter, mantenha o Discord organizado com 
            canais claros, e publique documentação atualizada. Transparência gera confiança.
          </div>
        </section>

        {/* Como usar o Token Lab como portfólio */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-400">8.5 — Como Usar o Token Lab como Portfólio</h3>
          <p className="leading-relaxed">
            O <strong>ERC20 Token Lab</strong> não é apenas uma ferramenta — é um <strong>projeto 
            de portfólio</strong> que demonstra habilidades valorizadas no mercado de Web3:
          </p>
          <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold shrink-0">1.</span>
              <div>
                <p className="font-semibold text-white text-sm">Full-stack Web3</p>
                <p className="text-xs text-neutral-400">Você mostra domínio do stack completo: smart contracts (Solidity + Hardhat + OpenZeppelin) + frontend (Next.js + ethers.js + TypeScript).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold shrink-0">2.</span>
              <div>
                <p className="font-semibold text-white text-sm">Boas práticas de segurança</p>
                <p className="text-xs text-neutral-400">Uso de bibliotecas auditadas, variáveis de ambiente, separação de responsabilidades — tudo que empregadores procuram.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold shrink-0">3.</span>
              <div>
                <p className="font-semibold text-white text-sm">UX Web3</p>
                <p className="text-xs text-neutral-400">Integração com MetaMask, tratamento de estados (loading, erro, sucesso), responsividade — mostra que você entende o usuário final.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold shrink-0">4.</span>
              <div>
                <p className="font-semibold text-white text-sm">Conhecimento do ecossistema</p>
                <p className="text-xs text-neutral-400">ERC20, testnets, deploy, verificação no Etherscan, tokenomics — você não é apenas um codificador, entende o negócio.</p>
              </div>
            </div>
          </div>
          <p className="leading-relaxed">
            Para maximizar o impacto do seu portfólio:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-300">
            <li>Faça o deploy do contrato em uma testnet (Sepolia) e deixe o frontend funcionando on-line (Vercel ou Netlify).</li>
            <li>Inclua um link para o repositório GitHub bem documentado com README, instruções de setup e prints.</li>
            <li>Escreva um artigo no LinkedIn ou Medium explicando sua jornada de desenvolvimento.</li>
            <li>Participe de hackathons e adicione badges ao seu perfil.</li>
          </ul>
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-4 text-sm">
            <strong className="text-emerald-400">🎯 Meta final:</strong> Ao completar este curso, 
            você terá construído, implantado e conectado um token ERC20 real a uma interface web — 
            algo que a maioria dos desenvolvedores tradicionais ainda não sabe fazer. Use isso 
            como seu diferencial competitivo no mercado de trabalho Web3.
          </div>
        </section>
      </div>
    ),
  },
];

export default function CoursePage() {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const totalMinutes = MODULES.reduce((acc, m) => acc + m.minutes, 0);

  // Check access on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseId = params.get("purchase_id");

    // Check localStorage first
    const storedAccess = localStorage.getItem("course_access");
    if (storedAccess === "granted") {
      setHasAccess(true);
      setChecking(false);
      return;
    }

    // Verify purchase_id via API
    if (purchaseId) {
      fetch(`/api/verify-access?purchase_id=${purchaseId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            localStorage.setItem("course_access", "granted");
            // Remove purchase_id from URL
            window.history.replaceState({}, "", "/course");
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        })
        .catch(() => setHasAccess(false))
        .finally(() => setChecking(false));
    } else {
      setHasAccess(false);
      setChecking(false);
    }
  }, []);

  // Not purchased — show buy prompt
  if (!checking && !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-full">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Curso Bloqueado 🔒</h1>
          <p className="text-neutral-400 max-w-md mx-auto">
            Você precisa adquirir o curso para acessar o conteúdo completo com 8 módulos.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-extrabold text-white">R$ 19</span>
            <span className="text-sm text-neutral-500 line-through">R$ 49</span>
          </div>
          <a
            href="/#curso"
            className="inline-block mt-4 px-10 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            Comprar Agora
          </a>
        </div>
        <p className="text-xs text-neutral-600">
          Já comprou?{" "}
          <a href="/#curso" className="text-blue-400 underline">
            Use o link do seu email de compra
          </a>
        </p>
      </div>
    );
  }

  // Checking access
  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 animate-pulse">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho do Curso */}
      <div className="mb-12 space-y-6">
        <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400 font-medium tracking-wide uppercase">
          Curso Completo
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Do Zero ao seu{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Token ERC20
          </span>
        </h1>
        <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl">
          Um curso abrangente e prático sobre desenvolvimento Web3 — da teoria da blockchain 
          até o deploy do seu próprio token e estratégias de mercado. Tudo em Português BR.
        </p>

        {/* Metadados do curso */}
        <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {totalMinutes} min de leitura
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {MODULES.length} módulos
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nível: Iniciante a Intermediário
          </span>
        </div>

        {/* Barra de progresso (placeholder estético) */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: activeModule ? `${(activeModule / MODULES.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Grade de módulos (índice) */}
      <div className="grid gap-3 mb-12">
        {MODULES.map((mod) => {
          const isOpen = activeModule === mod.id;
          return (
            <div
              key={mod.id}
              className="border border-white/10 rounded-xl overflow-hidden transition-all duration-200 hover:border-white/20"
            >
              <button
                onClick={() => setActiveModule(isOpen ? null : mod.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left bg-neutral-900/50 hover:bg-neutral-900/80 transition-colors"
              >
                {/* Número do módulo */}
                <span className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                  {mod.id}
                </span>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{mod.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{mod.subtitle}</p>
                </div>
                {/* Tempo */}
                <span className="shrink-0 text-xs text-neutral-500 bg-white/5 px-2.5 py-1 rounded-full">
                  {mod.minutes} min
                </span>
                {/* Seta */}
                <svg
                  className={`shrink-0 w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Conteúdo do módulo (expansível) */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 sm:px-5 pb-6 pt-2 border-t border-white/10">
                  {mod.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção final de conclusão */}
      <div className="border border-emerald-900/40 bg-emerald-950/20 rounded-xl p-6 text-center space-y-3">
        <div className="text-3xl">🎉</div>
        <h3 className="text-xl font-bold text-emerald-400">Parabéns por completar o curso!</h3>
        <p className="text-neutral-400 text-sm max-w-lg mx-auto">
          Você agora tem conhecimento para criar, implantar e conectar seu próprio token ERC20 
          a uma interface web completa. Continue praticando, participe de hackathons e construa 
          seu portfólio Web3.
        </p>
        <div className="pt-2 text-xs text-neutral-500">
          ERC20 Token Lab &mdash; Um projeto educacional open-source
        </div>
      </div>
    </div>
  );
}
