// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";

/**
 * @dev ERC20
 */
contract TokenFT is Token {
  /// @dev account => balance
  mapping(address => uint256) private _balances;
  /// @dev account => (spender => approved value)
  mapping(address => mapping(address => uint256)) private _allowances;

  constructor (string memory _name, string memory _symbol) Token (_name, _symbol) {}

  /// @dev approve spender to spend token on behave of owner
  /// @param spender authorised spender
  /// @param value authorised amount
  function approve(address spender, uint256 value) public override returns (bool) {
    if (spender == address(0)) revert ("Invalid Spender");
    
    address owner = msg.sender;
    if (balanceOf(owner) < value) revert ("Insufficient Allowance");

    _allowances[owner][spender] = value;

    return true;
  }

  /// @dev transfer token
  /// @param from owner address
  /// @param to destination address
  /// @param value transfer amount
  function transfer(address from, address to, uint256 value) public override returns (bool) {
    if (balanceOf(from) < value) revert ("Insufficient balance");

    address spender = msg.sender;
    if (spender != from) { // spender not owner
      if (allowance(from, spender) < value) revert ("Insufficient allowance");
    }

    unchecked {
      // Overflow not possible: value <= balance <= totalSupply.
      _balances[from] -= value;
      // Overflow not possible: balance + value is at most totalSupply, fits into a uint256.
      _balances[to] += value;
    }
    return true;
  }

  function mint(address account, uint256 value) public override {
    if (account == address(0)) revert("Mint: Invalid receiver address");
    _balances[account] += value;
  }

  function allowance(address owner, address spender) public view returns (uint256) {
    return _allowances[owner][spender];
  }

  function balanceOf(address account) public view returns (uint256) {
    return _balances[account];
  }

  // function ownerOf(uint256 val) public override returns (address) {
  //   return address(0);
  // }
}
