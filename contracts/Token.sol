// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

/**
 * @dev Token creation contract
 * International Token Identification Number (ITIN)
 */
contract Token {

  // token id => (owner => balance)
  mapping(uint256 => mapping(address => uint256)) internal balances;

  // function approve(uint256 tokentype, address owner) public returns (bool) {
  //   // allowed[msg.sender][delegate] = numTokens;
  //   return true;
  // }

}