// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract OneofMany {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  struct Param {
    alt_bn128.G1Point[] gs; // log(N) generators
    alt_bn128.G1Point[] cs; // N commitments (one is zero)
    alt_bn128.G1Point h; // g_ok
  }

  struct Sig {
    alt_bn128.G1Point cv;
    alt_bn128.G1Point ct;
    alt_bn128.G1Point[] cds; // log(N) commitments
    uint256[] fs; // log(N)
    uint256 u;
    uint256 s;
  }

  function setup(uint256 size, uint256[2] memory skj) public view returns (Param memory pp) {
    require(skj[1] < size, "OneofMany : skj out of bound");
    require(size & (size - 1) == 0,
      "OneofMany : size should be a power of 2"
    );
    pp.gs = new alt_bn128.G1Point[](log2(size));
    pp.cs = new alt_bn128.G1Point[](size);
    pp.h = alt_bn128.random().uintToCurvePoint();
    for (uint i = 0; i < pp.gs.length; i++) {
      pp.gs[i] = alt_bn128.random().uintToCurvePoint();
    }
    for (uint i = 0; i < size; i++) {
      pp.cs[i] = alt_bn128.random().uintToCurvePoint();
    }
    pp.cs[skj[1]] = pp.h.mul(skj[0]); // zero commitment
  }

  /// @dev setup one of many proof
  /// @param cs Ring
  /// @param h g_ok in XCSwap
  function param(
    alt_bn128.G1Point[] memory gs,
    alt_bn128.G1Point[] memory cs, 
    alt_bn128.G1Point memory h
  ) public pure returns (Param memory pp) {
    pp = Param({
      gs : gs,
      cs : cs,
      h : h
    });
  }

  /// @param skj (sk, theta)
  function sign(Param memory pp, uint256[2] memory skj) public view returns (Sig memory sig) {
    uint N = pp.cs.length;
    uint log_n = log2(N);

    uint256 rv = alt_bn128.random();
    uint256 rt = alt_bn128.random();

    uint256[] memory rds = new uint256[](log_n);

    sig.fs = new uint256[](log_n); // ml
    sig.cv = pp.h.mul(rv); // h^rv
    sig.ct = pp.h.mul(rt); // h^rt

    uint[] memory theta_bits = new uint[](log_n);
    for (uint i = 0; i < log_n; i++) {
      sig.fs[i] = alt_bn128.random();
      rds[i] = alt_bn128.random();

      theta_bits[i] = check_bit(skj[1], i) ? 1 : 0;
      
      /// @dev cv = g_l^{(1-2\theta_l)m_l}
      sig.cv = sig.cv.add(pp.gs[i].mul(
        alt_bn128.sub(1, theta_bits[i].mul(2)).mul(sig.fs[i])
      )); 
      
      /// @dev ct = g_l^{-m_l^2}
      sig.ct = sig.ct.add(pp.gs[i].mul(
        sig.fs[i].modExp(2).neg()
      )); 
    }

    uint256[][] memory ps = compute_pis(sig.fs, theta_bits, N);

    sig.cds = new alt_bn128.G1Point[](log_n);
    for (uint l = 0; l < log_n; l++) {
      sig.cds[l] = pp.h.mul(rds[l]); // h^rd
      for (uint i = 0; i < N; i++) {
        sig.cds[l] = sig.cds[l].add(pp.cs[i].mul(ps[i][l])); // c_i^p_{i,l}
      }
    }

    uint256 x = uint256(keccak256(abi.encode(sig.cv, sig.ct, sig.cds, pp.cs))) % alt_bn128.q;

    uint256 s = 0;
    for (uint l = 0; l < log_n; l++) {
      sig.fs[l] = sig.fs[l].add(theta_bits[l].mul(x));
      s = s.add(rds[l].mul(x.modExp(l)));
    }
    sig.u = rt.add(rv.mul(x));
    sig.s = skj[0].mul(x.modExp(log_n)).sub(s);
  }

  function verify(Param memory pp, Sig memory sig) public view returns (bool) {
    uint N = pp.cs.length;
    uint log_n = log2(N);
    uint256 x = uint256(keccak256(abi.encode(sig.cv, sig.ct, sig.cds, pp.cs))) % alt_bn128.q;

    alt_bn128.G1Point memory L1 = pp.h.mul(sig.u);
    for (uint l = 0; l < log_n; l++){
      L1 = L1.add(pp.gs[l].mul(sig.fs[l].mul(x.sub(sig.fs[l]))));
    }

    alt_bn128.G1Point memory R1 = sig.ct.add(sig.cv.mul(x));

    bool b1 = alt_bn128.eq(L1, R1);
    require(b1, "OneofMany : b1 failed");

    alt_bn128.G1Point memory L2 = pp.h.mul(sig.s);

    alt_bn128.G1Point memory R2 = alt_bn128.G1Point(0, 0);

    for (uint i = 0; i < N; i++) {
      uint256 f = 1;
      for (uint l = 0; l < log_n; l++) {
        if (check_bit(i, l)) { // i's lth bit = 1
          f = f.mul(sig.fs[l]);
        } else { // i's lth bit = 0
          f = f.mul(x.sub(sig.fs[l]));
        }
      }
      R2 = R2.add(pp.cs[i].mul(f));
    }

    for (uint l = 0; l < log_n; l++) {
      R2 = R2.add(sig.cds[l].mul(x.modExp(l)).neg());
    }

    bool b2 = alt_bn128.eq(L2, R2);
    require(b2, "OneofMany : b2 failed");

    return b1 && b2;
  }

  function compute_pis(
    uint256[] memory fs,
    uint256[] memory theta_bits,
    uint256 N
  ) private pure returns (uint256[][] memory ps) {
    uint log_n = log2(N);
    ps = new uint256[][](N);
    uint256[] memory pis;
    uint256[] memory term;

    for (uint i = 0; i < N; i++) {
      pis = new uint256[](log_n);
      pis[0] = 1; // identity
      for (uint j = 0; j < log_n; j++){
        term = new uint256[](2);
        if (check_bit(i, j)) { // i's jth bit = 1
          // delta_{1 \theta_j} x + a_j
          term[0] = fs[j];
          term[1] = theta_bits[j] == 1 ? 1 : 0;
        } else { // i's jth bit = 0
          // delta_{0 \theta_j} x - a_j
          term[0] = fs[j].neg();
          term[1] = theta_bits[j] == 0 ? 1 : 0;
        }
        // multiply all f_{j, i_j} for index j 
        pis = poly_mul(pis, term); 
      }
      ps[i] = pis;
    }

  }

  function poly_mul(uint256[] memory p1, uint256[] memory p2) private pure returns (uint256[] memory p){
    p = new uint256[](p1.length + p2.length - 1);
    for (uint i = 0; i < p1.length; i++) {
      for (uint j = 0; j < p2.length; j++) {
        p[i+j] = p[i+j].add(p1[i].mul(p2[j]));
      }
    }
  }

  function log2(uint x) private pure returns (uint n) {
    for (n = 0; x > 1; x >>= 1) n += 1;
  }

  /// @dev check if jth bit of i is 1
  function check_bit(uint i, uint j) private pure returns (bool) {
    return ((i >> j) & 1) == 1;
    // (i & (1 << j)) != 0
  } 

}