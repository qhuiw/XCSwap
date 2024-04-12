// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";
/// @dev prove that a single gen commitment has a same witness at pos x_idx 
/// in the witness of a multi gen commitment
contract DiffGenEqual {

  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  struct Sig {
    alt_bn128.G1Point cx; /// @dev proof of Cx
    alt_bn128.G1Point cy; /// @dev proof of Cy
    uint256[] zs;
    uint256 w;
    uint256 t;
  }
  
  /// @dev different generator
  /// @param gx single generator
  /// @param gys multi generator (last g_ok)
  /// @param x_idx index of witness x in y
  /// @param rx hiding value of single gen commitment
  /// @param ys multi generator witness (last elt is hiding value)
  function sign(
    alt_bn128.G1Point memory gx, 
    alt_bn128.G1Point[] memory gys, 
    uint256 x_idx,
    uint256 rx,
    uint256[] memory ys
  ) public view returns (Sig memory sig) {

    require(gys.length == ys.length, "DiffGenEqual: generator and witness length do not match");

    uint256[] memory rs = new uint256[](ys.length);
    sig.cy = alt_bn128.G1Point(0,0);

    uint256 rf = alt_bn128.random(); /// @dev hiding
    uint256 rv = alt_bn128.random(); /// @dev hiding
    alt_bn128.G1Point memory h = gys[gys.length-1]; /// @dev g_ok (hiding gen)
    uint256 ry = ys[ys.length-1];

    for (uint i = 0; i < rs.length-1; i++) {
      rs[i] = alt_bn128.random();
      sig.cy = sig.cy.add(gys[i].mul(rs[i]));
    }
    sig.cy = sig.cy.add(h.mul(rv));

    sig.cx = gx.mul(rs[x_idx]).add(h.mul(rf));

    uint256 e = uint256(keccak256(abi.encode(sig.cx, sig.cy)));

    for (uint i = 0; i < rs.length-1; i++) {
      rs[i] = rs[i].add(ys[i].mul(e));
    }
    sig.zs = rs;
    sig.w = rx.mul(e).add(rf);
    sig.t = ry.mul(e).add(rv);
  }

  /// @dev verify different generator signature
  /// @param gx single generator
  /// @param gys multi generator
  /// @param x_idx index of witness x in y
  /// @param Cx single gen commitment
  /// @param Cy multi gen commitment
  /// @param sig DiffGenEqual signature
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

    alt_bn128.G1Point memory h = gys[gys.length-1]; /// @dev g_ok (hiding gen)

    alt_bn128.G1Point memory b1L = gx.mul(sig.zs[x_idx]).add(h.mul(sig.w));
    alt_bn128.G1Point memory b1R = Cx.mul(e).add(sig.cx);
    bool b1 = alt_bn128.eq(b1L, b1R);
    require(b1, "DiffGenEqual : b1 failed");

    alt_bn128.G1Point memory b2L = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < gys.length-1; i++) {
      b2L = b2L.add(gys[i].mul(sig.zs[i]));
    }
    b2L = b2L.add(h.mul(sig.t));
    alt_bn128.G1Point memory b2R = Cy.mul(e).add(sig.cy);
    bool b2 = alt_bn128.eq(b2L, b2R);
    require(b2, "DiffGenEqual : b2 failed");

    return b1 && b2;
  }

}