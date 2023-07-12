// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

/**
 * @dev token interface
 */
contract Token {

  string private _name;
  string private _symbol;

  constructor (string memory name_, string memory symbol_) {
    _name = name_;
    _symbol = symbol_;
  }

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  // function approve(address to, uint256 val) external returns (bool);
  // function transfer(address from, address to, uint256 val) external returns (bool);
  // function mint(address to, uint256 val) external;

}