// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TestToken
/// @notice Token ERC20 com Mint (admin) e Burn (público + admin)
contract TestToken is ERC20, ERC20Burnable, Ownable {
    constructor(
        uint256 initialSupply
    ) ERC20("TestToken", "TTK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /// @notice Cria novos tokens para um endereço (apenas owner)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Queima tokens de qualquer conta (apenas owner - função admin)
    function adminBurn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
