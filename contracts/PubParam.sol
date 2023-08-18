// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";

contract PubParam {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  /// @dev [g_ty, g_val, ... , g_tbeg, g_tend, g_sk, g_opn, g_ok]
  alt_bn128.G1Point[] _gs;

  alt_bn128.G1Point _g_pk; /// @dev TagKGen
  alt_bn128.G1Point _g_tag; /// @dev TagEval

  alt_bn128.G1Point _h;

  uint _n_attr;
  uint _sk_pos;

  /// @dev one-time account
  struct Acc {
    alt_bn128.G1Point pk;
    alt_bn128.G1Point tcom;
    alt_bn128.G1Point ocom;
  }
  
  /// @dev extends to multi-token swap
  /// @param max_ty maximum number of traded token
  constructor (uint max_ty) {
    _n_attr = 2 * max_ty + 5;
    _sk_pos = 2 * max_ty + 2;
    init(_n_attr);
  }

  function init(uint _n) private {
    _h = uint256(1).uintToCurvePoint();
    _g_pk = alt_bn128.random().uintToCurvePoint();
    _g_tag = alt_bn128.random().uintToCurvePoint();

    for (uint i = 0; i < _n; i++) {
      _gs.push(alt_bn128.random().uintToCurvePoint());
    }
  }

  /// @dev pk = g_pk^sk
  function TagKGen(uint256 sk) public view returns (alt_bn128.G1Point memory pk) {
    pk = _g_pk.mul(sk);
  }

  /// @dev tag = g_tag^sk
  function TagEval(uint256 sk) public view returns (alt_bn128.G1Point memory tag) {
    tag = _g_tag.mul(sk);
  }

  /// @dev one-time account in single commitment form
  function Com(uint256[] memory attr) public view returns (alt_bn128.G1Point memory acc) {
    require (attr.length == _n_attr, "Length unmatched");
    acc = alt_bn128.G1Point(0, 0);
    for (uint i = 0 ; i < _n_attr; i++) {
      acc = acc.add(_gs[i].mul(attr[i]));
    }
  }

  function tCom(uint256[] memory attr) public view returns (alt_bn128.G1Point memory tcom) {
    require (attr.length >= _n_attr-2, "PubParam: attribute cardinality does not match");
    tcom = alt_bn128.G1Point(0, 0);
    for (uint i = 0; i < _n_attr-2; i++) {
      tcom = tcom.add(_gs[i].mul(attr[i]));
    }
  }

  function oCom(uint256[] memory attr) public view returns (alt_bn128.G1Point memory ocom) {
    require(attr.length == _n_attr, "PubParam: attribute cardinality does not match");
    ocom = alt_bn128.G1Point(0, 0);
    for (uint i = _n_attr-2; i < _n_attr; i++) {
      ocom = ocom.add(_gs[i].mul(attr[i]));
    }
  }

  /// @dev one-time account in composite form
  function onetAcc(uint256[] memory attr) public view returns (Acc memory) {
    require (attr.length == _n_attr, "PubParam: attribute cardinality does not match");
    return Acc({
      pk : TagKGen(attr[_n_attr-3]),
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

  function g_ok() public view returns (alt_bn128.G1Point memory) {
    return _gs[_n_attr-1];
  }

  function h() public view returns (alt_bn128.G1Point memory) {
    return _h;
  }

  function n() public view returns (uint) {
    return _n_attr;
  }
  
  function sk_pos() public view returns (uint) {
    return _sk_pos;
  }

  function randomAcc() public view returns (alt_bn128.G1Point memory) {
    return alt_bn128.random().uintToCurvePoint();
  }

  function com(alt_bn128.G1Point[2] memory g) public view returns (alt_bn128.G1Point memory) {
    return g[0].add(g[1]);
  }

}