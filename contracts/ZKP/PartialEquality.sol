// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";

contract PartialEqualtiy {

  PubParam private pp;
  
  constructor (address pp_addr) {
    pp = PubParam(pp_addr);
  }

  // function setup(uint256[] x, uint256[] y, uint[] idx_unequal) public pure returns () {

  // }

  function prove(uint256[] memory x, uint256[] memory y, uint[] memory idx_unequal) 
  public pure returns (uint256[] memory zs) {

    zs = new uint256[](1);
  }

}