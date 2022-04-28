// SPDX-License-Identifier: WTFPL

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Used in the tests only - see MultiSigWalletTest.js
contract TestERC20Token is ERC20 {
    constructor(address account, uint256 initialSupply) public ERC20("TestERC20Token", "TEST") {
        _mint(account, initialSupply);
    }
}