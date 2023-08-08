// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract Sigma {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  struct Sig {
    alt_bn128.G1Point Cr;
    uint256[] zs;
  }

  struct Param {
    alt_bn128.G1Point[] gs;
    alt_bn128.G1Point C;
  }

  function setup (uint256[] memory wit) public view returns (Param memory pp) {
    pp.gs = new alt_bn128.G1Point[](wit.length);
    pp.C = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < wit.length; i++) {
      pp.gs[i] = alt_bn128.random().uintToCurvePoint();
      pp.C = pp.C.add(pp.gs[i].mul(wit[i]));
    }
  }

  /// @dev plain sigma protocol
  function sign (
    alt_bn128.G1Point[] memory gs, 
    uint256[] memory wit
  ) public view returns (Sig memory sig) {
    require (gs.length == wit.length, "Length unmatched");

    sig.zs = new uint256[](wit.length);
    sig.Cr = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < wit.length; i++) {
      sig.zs[i] = alt_bn128.random();
      sig.Cr = sig.Cr.add(gs[i].mul(sig.zs[i]));
    }

    /// @dev Fiat-Shamir 
    uint256 x = uint256(keccak256(abi.encode(sig.Cr))) % alt_bn128.q;

    for (uint i = 0; i < wit.length; i++) {
      sig.zs[i] = sig.zs[i].add(wit[i].mul(x));
    }
  }

  /// @dev plain sigma protocol
  function verify(
    alt_bn128.G1Point[] memory gs, 
    alt_bn128.G1Point memory C,
    Sig memory sig
  ) public view returns (bool) {

    uint256 x = uint256(keccak256(abi.encode(sig.Cr))) % alt_bn128.q;

    alt_bn128.G1Point memory R = alt_bn128.add(C.mul(x), sig.Cr);

    alt_bn128.G1Point memory L = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < gs.length; i++) {
      L = L.add(gs[i].mul(sig.zs[i]));
    }
    
    return alt_bn128.eq(L, R);
  }


  /// @dev C has a witness at idx of the form m+s, where s is public
  /// @param wit original entry, eg if witness is b1+s, enter b1
  /// @param sj (s, idx)
  function signSum(
    alt_bn128.G1Point[] memory gs,
    uint256[] memory wit,
    uint256[2] memory sj
  ) public view returns (Sig memory sig) {

    require (gs.length == wit.length, "Length unmatched");

    sig.zs = new uint256[](wit.length);
    sig.Cr = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < wit.length; i++) {
      sig.zs[i] = alt_bn128.random();
      sig.Cr = sig.Cr.add(gs[i].mul(sig.zs[i]));
    }

    uint256 x = uint256(keccak256(abi.encode(sig.Cr))) % alt_bn128.q;

    for (uint i = 0; i < wit.length; i++) {
      if (i == sj[1]) {
        sig.zs[i] = sig.zs[i].add(wit[i].sub(sj[0]).mul(x));
      } else {
        sig.zs[i] = sig.zs[i].add(wit[i].mul(x));
      }
    }

  }

  /// @dev verify C has a wit at idx of the form m+s, where s is public
  /// @param C original commitment
  /// @param sj (s, idx)
  function verifySum(
    alt_bn128.G1Point[] memory gs,
    alt_bn128.G1Point memory C,
    Sig memory sig,
    uint256[2] memory sj
    ) public view returns (bool) {

    require (sj[1] < gs.length, "Index out of bound");

    uint256 x = uint256(keccak256(abi.encode(sig.Cr))) % alt_bn128.q;

    alt_bn128.G1Point memory R = alt_bn128.add(C.mul(x), sig.Cr);

    alt_bn128.G1Point memory L = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < gs.length; i++) {
      L = L.add(gs[i].mul(sig.zs[i]));
    }

    L = L.add(gs[sj[1]].mul(sj[0].mul(x)));

    return alt_bn128.eq(L, R);
  }


}