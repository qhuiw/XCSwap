// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

/**
 * @dev abstract token
 */
abstract contract Token {

  string private _name;
  string private _symbol;
  uint256 private _ty;

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

  function ty() external view returns (uint256) {
    return _ty;
  }

  function setTy(uint256 ty_) external {
    if (_ty != 0) revert ("Type exists");
    _ty = ty_;
  }

  function approve(address to, uint256 val) public virtual returns (bool);
  function isApproved(address to, uint256 val) public virtual returns (bool);
  function transfer(address from, address to, uint256 val) public virtual returns (bool);
  function mint(address to, uint256 val) public virtual;
  // function ownerOf(uint256 val) public virtual returns (address);

}