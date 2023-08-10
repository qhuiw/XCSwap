// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";
// import "../PubParam.sol";

contract PartialEquality {

  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  struct Sig {
    alt_bn128.G1Point c;
    uint256[] zs;
  }

  /// @param gs unequal
  /// @param x unequal witness
  /// @param y uneuqal witness
  function sign(
    alt_bn128.G1Point[] memory gs, 
    uint256[] memory x, 
    uint256[] memory y
  ) public view returns (Sig memory sig) {
    require(x.length == y.length && gs.length == x.length, "PartialEqualtiy: witness unequal length");

    uint256[] memory rs = new uint256[](x.length);
    alt_bn128.G1Point memory c = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < rs.length; i++) {
      rs[i] = alt_bn128.random();
      c = c.add(gs[i].mul(rs[i]));
    }
    /// @dev Fiat-Shamir 
    uint256 e = uint256(keccak256(abi.encode(c)));

    for (uint i = 0; i < rs.length; i++) {
      rs[i] = rs[i].add(alt_bn128.sub(x[i], y[i]).mul(e));
    }

    sig = Sig({
      c : c,
      zs : rs
    });
  }

  /// @param gs unequal 
  /// @param Cx commitment of witness x
  /// @param Cy commitment of witness y
  /// @param sig partial equality signature
  function verify (
    alt_bn128.G1Point[] memory gs, 
    alt_bn128.G1Point memory Cx,
    alt_bn128.G1Point memory Cy,
    Sig memory sig
  ) public view returns (bool) {
    require (gs.length == sig.zs.length, "PartialEquality: verify unequal length");

    alt_bn128.G1Point memory L = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < gs.length; i++) {
      L = L.add(gs[i].mul(sig.zs[i]));
    }

    /// @dev Fiat-Shamir 
    uint256 e = uint256(keccak256(abi.encode(sig.c)));

    alt_bn128.G1Point memory R = alt_bn128.add(sig.c, alt_bn128.add(Cx, Cy.neg()).mul(e));

    return alt_bn128.eq(L, R);
  }

  /// @param gs full generator
  /// @param x full witness
  /// @param y full witness
  /// @param idx_ne unequal indices
  function sign(
    alt_bn128.G1Point[] memory gs, 
    uint256[] memory x, 
    uint256[] memory y, 
    uint256[] memory idx_ne
  ) public view returns (Sig memory sig) {
    require(x.length == y.length, "PartialEqualtiy: witness unequal length");
    uint l = idx_ne.length;
    require (l < gs.length, "idx_ne length exceeds limit");

    uint256[] memory rs = new uint256[](l);
    alt_bn128.G1Point memory c = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < l; i++) {
      rs[i] = alt_bn128.random();
      require (idx_ne[i] < gs.length, "PartialEqualtiy: Index Overflow");
      c = c.add(gs[idx_ne[i]].mul(rs[i]));
    }
    /// @dev Fiat-Shamir 
    uint256 e = uint256(keccak256(abi.encode(c)));

    for (uint i = 0; i < l; i++) {
      rs[i] = rs[i].add(
        x[idx_ne[i]].sub(y[idx_ne[i]]).mul(e)
      );
    }

    sig = Sig({
      c : c,
      zs : rs
    });
  }

  /// @param gs full generator
  /// @param idx_ne unequal indices
  /// @param Cx commitment of full witness x
  /// @param Cy commitment of full witness y
  /// @param sig partial equality signature
  function verify (
    alt_bn128.G1Point[] memory gs, 
    uint256[] memory idx_ne, 
    alt_bn128.G1Point memory Cx,
    alt_bn128.G1Point memory Cy,
    Sig memory sig
  ) public view returns (bool) {

    alt_bn128.G1Point memory L = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < idx_ne.length; i++) {
      L = L.add(gs[idx_ne[i]].mul(sig.zs[i]));
    }

    /// @dev Fiat-Shamir 
    uint256 e = uint256(keccak256(abi.encode(sig.c)));

    alt_bn128.G1Point memory R = alt_bn128.add(sig.c, alt_bn128.add(Cx, Cy.neg()).mul(e));

    return alt_bn128.eq(L, R);
  }

}