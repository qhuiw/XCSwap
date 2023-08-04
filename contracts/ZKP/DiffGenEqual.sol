// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract DiffGenEqual {

  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  struct Sig {
    alt_bn128.G1Point cx;
    alt_bn128.G1Point cy;
    uint256[] zs;
  }
  
  /// @dev different generator
  /// @param gx single generator
  /// @param gys multi generator
  /// @param x_idx index of witness x in y
  /// @param ys multi generator witness 
  function sign(
    alt_bn128.G1Point memory gx, 
    alt_bn128.G1Point[] memory gys, 
    uint256 x_idx,
    uint256[] memory ys
  ) public view returns (Sig memory sig) {

    require(gys.length == ys.length, "DiffGenEqual: generator and witness length do not match");

    uint256[] memory rs = new uint256[](ys.length);
    alt_bn128.G1Point memory cy = alt_bn128.G1Point(0,0);

    for (uint i = 0; i < rs.length; i++) {
      rs[i] = alt_bn128.random();

      cy = cy.add(gys[i].mul(rs[i]));
    }

    alt_bn128.G1Point memory cx = gx.mul(rs[x_idx]);

    uint256 e = uint256(keccak256(abi.encode(cx, cy)));

    for (uint i = 0; i < rs.length; i++) {
      rs[i] = rs[i].add(ys[i].mul(e));
    }

    sig = Sig({
      cx : cx,
      cy : cy,
      zs : rs
    });
  }

  /// @param gx single generator
  /// @param gys multi generator
  /// @param x_idx index of witness x in y
  /// @param Cx single gen commitment
  function verify(
    alt_bn128.G1Point memory gx, 
    alt_bn128.G1Point[] memory gys, 
    uint256 x_idx,
    alt_bn128.G1Point memory Cx,
    alt_bn128.G1Point memory Cy,
    Sig memory sig
  ) public view returns (bool) {
    require (gys.length == sig.zs.length, "DiffGenEqual : generator and response length do not match");

    uint256 e = uint256(keccak256(abi.encode(sig.cx, sig.cy)));

    alt_bn128.G1Point memory b1L = gx.mul(sig.zs[x_idx]);
    alt_bn128.G1Point memory b1R = Cx.mul(e).add(sig.cx);
    bool b1 = alt_bn128.eq(b1L, b1R);

    alt_bn128.G1Point memory b2L = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < gys.length; i++) {
      b2L = b2L.add(gys[i].mul(sig.zs[i]));
    }
    alt_bn128.G1Point memory b2R = Cy.mul(e).add(sig.cy);
    bool b2 = alt_bn128.eq(b2L, b2R);

    return b1 && b2;
  }

}