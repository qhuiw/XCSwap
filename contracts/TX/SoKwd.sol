// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";
import {PartialEquality as PE} from "../ZKP/PartialEquality.sol";
import {DualRingEC as DR} from "../ZKP/DualRingEC.sol";
import {DiffGenEqual as DG} from "../ZKP/DiffGenEqual.sol";

contract SoKwd {

  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  /// @param R ring accounts
  /// @param tag tag = g_tag^sk
  /// @param attrS (ty, val, t_beg, t_end)
  /// @param u_rcpt receipt address
  struct TX {
    alt_bn128.G1Point[] R; 
    alt_bn128.G1Point tag;
    uint256[] attrS;
    address u_rcpt;
  }

  struct Sig {
    alt_bn128.G1Point acc_d;
    DR.SigEC dr_sig;
    DG.Sig dg_sig;
    PE.Sig pe_sig;
  }

  PubParam pp;
  PE pe;
  DR dr;
  DG dg;

  constructor (address pp_addr, address pe_addr, address dr_addr, address dg_addr) {
    pe = PE(pe_addr);
    dr = DR(dr_addr);
    dg = DG(dg_addr);
    pp = PubParam(pp_addr);
  }

  /// @param wit (𝜃S, skS, opnS, okS)
  function sign(TX memory tx_wd, uint256[4] memory wit) public view returns (Sig memory sig){
    require (tx_wd.tag.eq(pp.TagEval(wit[1])), "Tag matches");

    uint n = pp.n();
    uint pub_l = tx_wd.attrS.length;
    uint ne_l = n-tx_wd.attrS.length;

    uint256[] memory acc_d_attr = new uint256[](n);
    uint256[] memory y = new uint256[](n);
    uint256[] memory i_ne = new uint256[](ne_l);

    for (uint i = 0; i < pub_l; i++) {
      acc_d_attr[i] = tx_wd.attrS[i];
      y[i] = tx_wd.attrS[i];
    }

    for (uint i = 0; i < ne_l; i++) {
      acc_d_attr[pub_l+i] = wit[1+i]; // (sk, opn, ok)
      i_ne[i] = pub_l + i; // [4,5,6]
    }

    acc_d_attr[n-1] = alt_bn128.random(); // acc_d ok'

    alt_bn128.G1Point memory acc_d = pp.Com(acc_d_attr); // acc_d
    sig.acc_d = acc_d;

    // alt_bn128.G1Point[] memory new_R = new alt_bn128.G1Point[](tx_wd.R.length); // ring pks

    for (uint i = 0; i < tx_wd.R.length; i++) {
      tx_wd.R[i] = tx_wd.R[i].add(acc_d.neg()); // ring pks := {acc/acc_d}
    }

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_wd.R, pp.h());
    bytes memory m = abi.encode(tx_wd.u_rcpt);
    uint256[2] memory skj = [wit[3].sub(acc_d_attr[n-1]), wit[0]]; // (ok-ok', theta)

    /// @dev Ring signature {acc/acc_d}
    sig.dr_sig = dr.signEC(dr_pp, m, skj);

    /// @dev Diff Gen Equal signature (tag vs acc_d)
    sig.dg_sig = dg.sign(pp.g_tag(), pp.gs(), pp.sk_pos(), acc_d_attr);

    /// @dev Partial Equality signature (acc_d vs pub)
    sig.pe_sig = pe.sign(pp.gs(), acc_d_attr, y, i_ne);

  }

  function verify(TX memory tx_wd, Sig memory sig) public view returns (bool) {
    for (uint i = 0; i < tx_wd.R.length; i++) {
      tx_wd.R[i] = tx_wd.R[i].add(sig.acc_d.neg()); 
      // ring pks := {acc/acc_d}
    }

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_wd.R, pp.h());
    bytes memory m = abi.encode(tx_wd.u_rcpt);

    /// @dev verify Ring signature
    bool b_dr = dr.verifyEC(dr_pp, m, sig.dr_sig);
    require (b_dr, "Ring signature does not pass");

    /// @dev verify Diff Gen Equal signature
    bool b_dg = dg.verify(pp.g_tag(), pp.gs(), pp.sk_pos(), tx_wd.tag, sig.acc_d, sig.dg_sig);
    require (b_dg, "Diff Gen Equal signature does not pass");

    uint256[] memory y = new uint256[](pp.n());
    for (uint i = 0; i < tx_wd.attrS.length; i++) {
      y[i] = tx_wd.attrS[i];
    }
    alt_bn128.G1Point memory Cy = pp.Com(y);

    uint256[] memory ine = new uint256[](pp.n() - tx_wd.attrS.length);
    for (uint i = 0; i < ine.length; i++) {
      ine[i] = i+tx_wd.attrS.length; // [4,5,6]
    }

    /// @dev verify Partial Equality signature
    bool b_pe = pe.verify(pp.gs(), ine, sig.acc_d, Cy, sig.pe_sig);
    require (b_pe, "Partial Equality signature does not pass");

    return b_dr && b_dg && b_pe;
  }
}