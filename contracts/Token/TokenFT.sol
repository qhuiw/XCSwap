// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
 * @dev ERC20
 */
contract TokenFT is Token, ERC20 {

  constructor (string memory _name, string memory _symbol) Token (_name, _symbol) ERC20 (_name, _symbol) {}

  function name() public view override(ERC20, Token) returns (string memory) {
    return super.name();
  }

  function symbol() public view override(ERC20, Token) returns (string memory) {
    return super.symbol();
  }

  /// @dev approve spender to spend token on behave of owner
  /// @param spender authorised spender
  /// @param value authorised amount
  function approve(address spender, uint256 value) public override(ERC20) returns (bool) {
    return ERC20.approve(spender, value);
  }

  function isApproved(address spender, uint256 value) public view override returns (bool){
    address owner = _msgSender();
    if (balanceOf(owner) < value) revert ("Insufficient Allowance");
    return ERC20.allowance(owner, spender) >= value;
  }

  /// @dev transfer token
  /// @param from owner address
  /// @param to destination address
  /// @param value transfer value
  function transfer(address from, address to, uint256 value) public override returns (bool) {
    // return ERC20.transferFrom(from, to, value);
    ERC20._transfer(from, to, value);
    return true;
  }

  function mint(address account, uint256 value) public override {
    ERC20._mint(account, value);
  }

}

contract FTFactory {
  address[] _tokens;

  function createFT(string memory name, string memory symbol) public {
    TokenFT token = new TokenFT(name, symbol);
    _tokens.push(address(token));
  }

  function getTokens() public view returns (address[] memory) {
    return _tokens;
  }
}