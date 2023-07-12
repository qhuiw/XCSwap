// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";

/**
 * @dev Token Registrar
 */
contract TokenRegistrar {
  /// @dev unique type => token symbol
  mapping(uint256 => string) tokenTy;

  function register(address token) public returns (bool) {
    if (_exists(token)) return false;
    uint256 ty = _hash(token); 
    tokenTy[ty] = Token(token).symbol();
    return true;
  }

  function isRegistered(address token) public view returns (bool) {
    return _exists(token);
  }

  /// @dev checks if token token already exists
  /// @param token token
  function _exists(address token) private view returns (bool) {
    uint256 ty = _hash(token);
    return ty == uint256(keccak256(abi.encode(tokenTy[ty])));
  }

  function _hash(address token) private view returns (uint256) {
    Token t = Token(token);
    return uint256(keccak256(abi.encode(t.symbol())));
  }

}