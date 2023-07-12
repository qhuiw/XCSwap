// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";
import "./Token/Token.sol";

contract Transactions {

  struct account {
    alt_bn128.G1Point acc;
    alt_bn128.G1Point tcom;
    alt_bn128.G1Point ocom;
  }

  /**
   * @dev create a P account
   */
  function deposit() public pure returns (bool){

    return true;
  }

  function withdrawal() public pure returns (bool){

  }

  function spend() public pure returns (bool){

  }

}