// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";

contract PubParam {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  /// @dev g_ty, g_val, g_tbeg, g_tend, g_sk, g_opn, g_ok;
  alt_bn128.G1Point[] _gs;

  alt_bn128.G1Point _g_pk; /// @dev TagKGen
  alt_bn128.G1Point _g_tag; /// @dev TagEval

  alt_bn128.G1Point _h;

  uint n_attr;

  struct Acc {
    alt_bn128.G1Point pk;
    alt_bn128.G1Point tcom;
    alt_bn128.G1Point ocom;
  }
  
  constructor (uint max_ty) {
    n_attr = 2*max_ty + 5;
    init(n_attr);
  }

  function init(uint _n) private {
    _h = uint256(1).uintToCurvePoint();
    _g_pk = alt_bn128.random().uintToCurvePoint();
    _g_tag = alt_bn128.random().uintToCurvePoint();

    for (uint i = 0; i < _n; i++) {
      _gs.push(alt_bn128.random().uintToCurvePoint());
    }
  }

  /// @dev generate public key
  function TagKGen(uint256 sk) public view returns (alt_bn128.G1Point memory pk) {
    pk = _g_pk.mul(sk);
  }

  /// @dev generate tag
  function TagEval(uint256 sk) public view returns (alt_bn128.G1Point memory tag) {
    tag = _g_tag.mul(sk);
  }

  function Com(uint256[] memory attr) public view returns (alt_bn128.G1Point memory acc) {
    require (attr.length == n_attr, "Length unmatched");
    acc = alt_bn128.G1Point(0, 0);
    for (uint i = 0 ; i < n_attr; i++) {
      acc = acc.add(_gs[i].mul(attr[i]));
    }
  }

  function tCom(uint256[] memory attr) public view returns (alt_bn128.G1Point memory tcom) {
    tcom = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < n_attr-2; i++) {
      tcom = tcom.add(_gs[i].mul(attr[i]));
    }
  }

  function oCom(uint256[] memory attr) public view returns (alt_bn128.G1Point memory ocom) {
    ocom = alt_bn128.G1Point(0, 0);
    for (uint i = n_attr-2; i < n_attr; i++) {
      ocom = ocom.add(_gs[i].mul(attr[i]));
    }
  }

  function onetAcc(uint256[] memory attr) public view returns (Acc memory) {
    require (attr.length == n_attr, "PubParam: attribute cardinality does not match");
    return Acc({
      pk : TagKGen(attr[n_attr-3]),
      tcom : tCom(attr),
      ocom : oCom(attr)
    });
  }

  function gs() public view returns (alt_bn128.G1Point[] memory) {
    return _gs;
  }
  
  function g_tag() public view returns (alt_bn128.G1Point memory) {
    return _g_tag;
  }

  function g_pk() public view returns (alt_bn128.G1Point memory) {
    return _g_pk;
  }

  function h() public view returns (alt_bn128.G1Point memory) {
    return _h;
  }

  function n() public view returns (uint) {
    return n_attr;
  }

}