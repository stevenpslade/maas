// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MultiSigWallet {
	using ECDSA for bytes32;

	event Deposit(address indexed sender, uint amount, uint balance);
	event ExecuteTransaction( address indexed owner, address payable to, uint256 value, bytes data, uint256 nonce, bytes32 hash, bytes result);
	event Owner( address indexed owner, bool added);

	mapping(address => bool) public isOwner;

	uint public signaturesRequired;
	uint public nonce;
	uint public chainId;

  modifier onlyOwner() {
    require(isOwner[msg.sender], "Not owner");
    _;
  }

  modifier onlySelf() {
    require(msg.sender == address(this), "Not Self");
    _;
  }

  modifier requireNonZeroSignatures(uint _signaturesRequired) {
    require(_signaturesRequired > 0, "Must be non-zero sigs required");
    _;
  }

  constructor(uint256 _chainId, address[] memory _owners, uint _signaturesRequired) payable requireNonZeroSignatures(_signaturesRequired) {
    signaturesRequired = _signaturesRequired;
    for (uint i = 0; i < _owners.length; i++) {
      address owner = _owners[i];

      require(owner!=address(0), "constructor: zero address");
      require(!isOwner[owner], "constructor: owner not unique");

      isOwner[owner] = true;

      emit Owner(owner,isOwner[owner]);
    }

    chainId = _chainId;
  }

  function addSigner(address newSigner, uint256 newSignaturesRequired) public onlySelf requireNonZeroSignatures(newSignaturesRequired) {
    require(newSigner != address(0), "addSigner: zero address");
    require(!isOwner[newSigner], "addSigner: owner not unique");

    isOwner[newSigner] = true;
    signaturesRequired = newSignaturesRequired;

    emit Owner(newSigner, isOwner[newSigner]);
  }

  function removeSigner(address oldSigner, uint256 newSignaturesRequired) public onlySelf requireNonZeroSignatures(newSignaturesRequired) {
    require(isOwner[oldSigner], "removeSigner: not owner");

    isOwner[oldSigner] = false;
    signaturesRequired = newSignaturesRequired;

    emit Owner(oldSigner, isOwner[oldSigner]);
  }

  function updateSignaturesRequired(uint256 newSignaturesRequired) public onlySelf requireNonZeroSignatures(newSignaturesRequired) {
    signaturesRequired = newSignaturesRequired;
  }

  function executeTransaction( address payable to, uint256 value, bytes memory data, bytes[] memory signatures)
      public
      onlyOwner
      returns (bytes memory)
  {
    bytes32 _hash =  getTransactionHash(nonce, to, value, data);

    nonce++;

    uint256 validSignatures;
    address duplicateGuard;
    for (uint i = 0; i < signatures.length; i++) {
        address recovered = recover(_hash, signatures[i]);
        require(recovered > duplicateGuard, "executeTransaction: duplicate or unordered signatures");
        duplicateGuard = recovered;

        if (isOwner[recovered]) {
          validSignatures++;
        }
    }

    require(validSignatures >= signaturesRequired, "executeTransaction: not enough valid signatures");

    (bool success, bytes memory result) = to.call{value: value}(data);
    require(success, "executeTransaction: tx failed");

    emit ExecuteTransaction(msg.sender, to, value, data, nonce-1, _hash, result);
    return result;
  }

  function getTransactionHash( uint256 _nonce, address to, uint256 value, bytes memory data ) public view returns (bytes32) {
    return keccak256(abi.encodePacked(address(this), chainId, _nonce, to, value, data));
  }

  function recover(bytes32 _hash, bytes memory _signature) public pure returns (address) {
    return _hash.toEthSignedMessageHash().recover(_signature);
  }

  receive() payable external {
    emit Deposit(msg.sender, msg.value, address(this).balance);
  }
}
