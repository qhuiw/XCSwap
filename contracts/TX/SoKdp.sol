// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";

import {PartialEquality as PE} from "../ZKP/PartialEquality.sol";

contract SoKdp {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  PubParam pp;
  PE pe;

  constructor (address pp_addr, address pe_addr) {
    pp = PubParam(pp_addr);
    pe = PE(pe_addr);
  }

  /// @param s (pk, tcom, ocom)
  /// @param attrS (ty, val, t_beg, t_end)
  struct TX {
    PubParam.Acc s;
    uint256[] attrS;
  }

  struct Sig {
    PE.Sig pe_sig;
  }

  /// @dev sok L_{dp} sign
  /// @param tx_dp deposit transaction statement
  /// @param wit witness (sk, opn, ok)
  /// @return sig deposit signature
  function sign(TX memory tx_dp, uint256[3] memory wit) public view returns (Sig memory sig) {
    uint n = pp.n();

    uint256[] memory x = new uint256[](n);
    uint256[] memory y = new uint256[](n);
    uint256[] memory ine = new uint256[](wit.length); // [4,5,6]

    for (uint i = 0; i < tx_dp.attrS.length; i++){
      x[i] = tx_dp.attrS[i];
      y[i] = tx_dp.attrS[i];
    }

    for (uint i = 0; i < wit.length; i++) {
      x[i+tx_dp.attrS.length] = wit[i];
      ine[i] = i + tx_dp.attrS.length;
    }

    PE.Sig memory pe_sig = pe.sign(pp.gs(), x, y, ine);

    sig = Sig({
      pe_sig : pe_sig
    });
  }

  /// @param tx_dp deposit transaction statement
  /// @param sig deposit signature
  function verify(TX memory tx_dp, Sig memory sig) public view returns (bool) {
    alt_bn128.G1Point memory Cx = tx_dp.s.tcom.add(tx_dp.s.ocom);

    uint256[] memory y = new uint256[](pp.n());
    for (uint i = 0; i < tx_dp.attrS.length; i++) {
      y[i] = tx_dp.attrS[i];
    }
    alt_bn128.G1Point memory Cy = pp.Com(y);

    uint256[] memory ine = new uint256[](pp.n() - tx_dp.attrS.length);
    for (uint i = 0; i < ine.length; i++) {
      ine[i] = i+tx_dp.attrS.length; // [4,5,6]
    }

    return pe.verify(pp.gs(), ine, Cx, Cy, sig.pe_sig);
  }

}