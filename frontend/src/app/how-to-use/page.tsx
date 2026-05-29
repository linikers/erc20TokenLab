export default function HowToUsePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Como Usar o ERC20 Token Lab</h1>
        <p className="text-neutral-400">
          Siga os passos abaixo para começar a interagir com seus tokens.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="flex gap-6 items-start p-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
            1
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Conecte sua Carteira</h3>
            <p className="text-neutral-400">
              Use a extensão do MetaMask para conectar sua carteira à aplicação.
              Certifique-se de estar na rede de testes desejada.
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start p-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
            2
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Visualize seu Token</h3>
            <p className="text-neutral-400">
              Na página 'Token' ou 'Dashboard', você poderá ver as informações
              principais do contrato inteligente implantado.
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start p-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center font-bold text-xl">
            3
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Realize Transferências</h3>
            <p className="text-neutral-400">
              Vá para a aba 'Transfer', insira o endereço de destino e a
              quantidade de tokens. Confirme a transação no MetaMask.
            </p>
          </div>
        </div>
      </div>

      {/* <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-4">
        <h3 className="text-xl font-bold text-amber-500">Atenção!</h3>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Esta é uma aplicação de demonstração rodando em ambiente de testes. Nunca envie fundos reais (Mainnet) para endereços gerados em plataformas de estudo.
        </p>
      </div> */}
    </div>
  );
}
