// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";

/**
 * @dev Token Registrar
 */
contract TokenRegistrar {
  /// @dev unique type id => token address
  mapping(uint256 => address) _tokenTy;

  /// @dev register a token
  /// @param tk_addr token address
  function register(address tk_addr) public returns (bool) {
    if (_exists(tk_addr)) return false;
    uint256 ty = _hash(tk_addr); 
    _tokenTy[ty] = tk_addr;
    // set ty
    Token(tk_addr).setTy(ty);
    return true;
  }

  /// @dev obtain registered type identifier
  function getTy(address tk_addr) public view returns (uint256) {
    if (!isRegistered(tk_addr)) revert ("Token not registered");
    return _hash(tk_addr);
  }

  /// @dev checks if a token is already registered
  /// @param tk_addr token address
  function isRegistered(address tk_addr) public view returns (bool) {
    return _exists(tk_addr);
  }

  /// @dev get token address by its unique type
  /// @param ty token type
  function getToken(uint256 ty) public view returns (address) {
    address tk_addr = _tokenTy[ty];
    if (tk_addr == address(0)) revert ("Token type not exist");
    return tk_addr;
  }

  /// @dev checks if a token already exists
  /// @param tk_addr token address
  function _exists(address tk_addr) private view returns (bool) {
    uint256 ty = _hash(tk_addr);
    return _tokenTy[ty] != address(0);
  }

  /// @dev unique token identifier by hashing name and symbol
  /// @param tk_addr token address
  function _hash(address tk_addr) private view returns (uint256) {
    Token t = Token(tk_addr);
    return uint256(keccak256(abi.encodePacked(t.name(), t.symbol(), tk_addr)));
  }

}