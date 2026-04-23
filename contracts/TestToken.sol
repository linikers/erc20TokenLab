// SPDX-License-Identifier: MIT
// Define a licença do código (MIT é uma licença permissiva padrão)

pragma solidity ^0.8.28;
// Especifica a versão do compilador Solidity a ser usada

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// Importa a implementação padrão do padrão ERC20 da OpenZeppelin

contract TestToken is ERC20 {
    // Declara o contrato 'TestToken' que herda (is) as funcionalidades do contrato ERC20

    constructor(uint256 initialSupply) ERC20("TestToken", "TTK") {
        // O construtor é executado apenas uma vez durante o deploy
        // ERC20("TestToken", "TTK") chama o construtor do contrato herdado, definindo o nome e o símbolo
        
        _mint(msg.sender, initialSupply * 10 ** decimals());
        // Chama a função interna '_mint' para criar os tokens iniciais
        // 'msg.sender' é o endereço que está realizando o deploy (deployer)
        // 'initialSupply * 10 ** decimals()' ajusta o valor para considerar as 18 casas decimais padrão
    }
}
