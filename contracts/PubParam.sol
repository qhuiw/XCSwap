// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";

contract PubParam {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  // alt_bn128.G1Point g_ty; /// @dev convert to list for multi-token swap
  // alt_bn128.G1Point g_val;
  // alt_bn128.G1Point g_tbeg;
  // alt_bn128.G1Point g_tend;
  // alt_bn128.G1Point g_sk;
  // alt_bn128.G1Point g_opn;
  // alt_bn128.G1Point g_ok;

  /// @dev g_ty, g_val, g_tbeg, g_tend, g_sk, g_opn, g_ok;
  alt_bn128.G1Point[] gs;

  alt_bn128.G1Point g_pk; /// @dev TagKGen
  alt_bn128.G1Point g_tag; /// @dev TagEval

  alt_bn128.G1Point h;
  
  constructor (uint max_ty) {
    init(max_ty);
  }

  function init(uint max_ty) private {
    h = uint256(1).uintToCurvePoint();
    g_pk = alt_bn128.random().uintToCurvePoint();
    g_tag = alt_bn128.random().uintToCurvePoint();

    for (uint i = 0; i < 2*max_ty + 5; i++) {
      gs.push(alt_bn128.random().uintToCurvePoint());
    }
    // gs = new alt_bn128.G1Point[](2*max_ty + 5);
    // for (uint i = 0; i < gs.length; i++){
    //   gs[i] = alt_bn128.random().uintToCurvePoint();
    // }
  }

  function TagKGen(uint256 sk) public view returns (alt_bn128.G1Point memory pk) {
    pk = g_pk.mul(sk);
  }


  // function gs() public pure
  
  
  

}