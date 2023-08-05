// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";
import {PartialEquality as PE} from "../ZKP/PartialEquality.sol";
import {DualRingEC as DR} from "../ZKP/DualRingEC.sol";
import {DiffGenEqual as DG} from "../ZKP/DiffGenEqual.sol";

contract SoKsp {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  PubParam pp;
  PE pe;
  DR dr;
  DG dg;
  uint n;

  constructor (
    address pp_addr, 
    address pe_addr, 
    address dr_addr, 
    address dg_addr
  ) {
    pp = PubParam(pp_addr);
    pe = PE(pe_addr);
    dr = DR(dr_addr);
    dg = DG(dg_addr);

    n = pp.n();
  }

  /// @param attrS (opnS, T_begS, T_endS)
  struct TX {
    alt_bn128.G1Point[] R;
    alt_bn128.G1Point tagS;
    uint256[3] attrS; 
    alt_bn128.G1Point pk_T;
    alt_bn128.G1Point[] tcom_T;
    alt_bn128.G1Point[] ocom_T;
  }

  /// @param theta index of sk in R
  /// @param attrS (ty, val, sk, ok)
  /// @param attrTs (T_beg, T_end, opn, ok)^{T}
  struct Wit {
    uint256 theta;
    uint256[] attrS;
    uint256 sk_T;
    uint256[4][] attrTs;
  }

  /// @param acc_d delegate of acc
  struct Sig {
    alt_bn128.G1Point acc_d;
    DR.SigEC dr_sig;
    DG.Sig dg_tag_sig;
    PE.Sig pe_opn_sig;
    PE.Sig[] pe_ty_sig;
    DG.Sig[] dg_sk_sig;
  }

  function sign(TX memory tx_sp, Wit memory wit) public view returns (Sig memory sig) {
    alt_bn128.G1Point[] memory Gs = pp.gs();

    uint256[] memory acc_d_attr = new uint256[](n);
    for (uint i = 0; i < n-5; i++) {
      acc_d_attr[i] = wit.attrS[i]; // (ty, val)
    }
    acc_d_attr[n-5] = tx_sp.attrS[1]; // T_beg
    acc_d_attr[n-4] = tx_sp.attrS[2]; // T_end
    acc_d_attr[n-3] = wit.attrS[n-5]; // sk
    acc_d_attr[n-2] = tx_sp.attrS[0]; // opn
    acc_d_attr[n-1] = alt_bn128.random(); // acc_d ok'

    alt_bn128.G1Point memory acc_d = pp.Com(acc_d_attr); // acc_d
    sig.acc_d = acc_d;

    for (uint i = 0; i < tx_sp.R.length; i++) {
      /// @dev ring pks := {acc/acc_d}
      tx_sp.R[i] = tx_sp.R[i].add(acc_d.neg()); 
    }

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_sp.R, pp.h());
    bytes memory m = abi.encode(address(0));
    uint256[2] memory skj = [wit.attrS[3].sub(acc_d_attr[n-1]), wit.theta]; // (ok-ok', theta)

    /// @dev 1. Ring signature {acc/acc_d}
    sig.dr_sig = dr.signEC(dr_pp, m, skj);

    /// @dev 2. Diff Gen Equal signature (tag vs acc_d)
    sig.dg_tag_sig = dg.sign(pp.g_tag(), Gs, pp.sk_pos(), acc_d_attr);

    /// @dev 3. Part Equal signature (same T_beg, T_end, opn)
    uint256[] memory pe_y = new uint256[](n);
    pe_y[n-5] = tx_sp.attrS[1]; // T_beg
    pe_y[n-4] = tx_sp.attrS[2]; // T_end
    pe_y[n-2] = tx_sp.attrS[0]; // opn

    uint256[] memory idx_ne = new uint256[](n-3);
    for (uint i = 0; i < n-5; i++){
      idx_ne[i] = i;
    }
    idx_ne[n-5] = n-3;
    idx_ne[n-4] = n-1;

    sig.pe_opn_sig = pe.sign(Gs, acc_d_attr, pe_y, idx_ne);

    /// @dev 4. Part Equal signatures (same tyS, valS)
    /// @dev 5. Diff Gen Equal signatures (pkT vs comT) 
    uint target_length = tx_sp.tcom_T.length;

    sig.pe_ty_sig = new PE.Sig[](target_length);
    sig.dg_sk_sig = new DG.Sig[](target_length);

    pe_y = new uint256[](n);
    for (uint i = 0; i < pp.sk_pos(); i++){
      pe_y[i] = wit.attrS[i];
    }

    idx_ne = new uint256[](5);
    for (uint i = 0; i < 5; i++){
      idx_ne[i] = n-5+i;
    }

    pe_y[n-3] = wit.sk_T;

    for (uint i = 0; i < target_length; i++){
      pe_y[n-5] = wit.attrTs[i][0]; // T_beg
      pe_y[n-4] = wit.attrTs[i][1]; // T_end
      pe_y[n-2] = wit.attrTs[i][2]; // opn
      pe_y[n-1] = wit.attrTs[i][3]; // ok

      sig.pe_ty_sig[i] = pe.sign(Gs, acc_d_attr, pe_y, idx_ne);
      sig.dg_sk_sig[i] = dg.sign(pp.g_pk(), Gs, pp.sk_pos(), pe_y);
    }
  }

  struct RTN {
    bool b_dr;
    bool b_dg_tag;
    bool b_pe_opn;
    bool[] b_pe_ty;
    bool[] b_dg_sk;
  }

  /// @dev verify the spend transaction
  function verify(TX memory tx_sp, Sig memory sig) public view returns (bool) {
    RTN memory b = verify_(tx_sp, sig);

    for (uint i = 0; i < b.b_pe_ty.length; i++) {
      if (!b.b_pe_ty[i] || !b.b_dg_sk[i]) return false;
    }

    return b.b_dr && b.b_dg_tag && b.b_pe_opn;
  }

  /// @dev verify the individual signatures
  /// @return b a struct of bools
  function verify_(TX memory tx_sp, Sig memory sig) private view returns (RTN memory b) {
    for (uint i = 0; i < tx_sp.R.length; i++) {
      /// @dev R pks := {acc/acc_d}
      tx_sp.R[i] = tx_sp.R[i].add(sig.acc_d.neg()); 
    }

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_sp.R, pp.h());

    /// @dev 1. verify Ring signature
    b.b_dr = dr.verifyEC(dr_pp, abi.encode(address(0)), sig.dr_sig);
    require (b.b_dr, "Ring signature does not pass");

    /// @dev 2. verify Diff Gen Equal signature (tag vs acc_d)
    alt_bn128.G1Point[] memory Gs = pp.gs();
    b.b_dg_tag = dg.verify(pp.g_tag(), Gs, pp.sk_pos(), tx_sp.tagS, sig.acc_d, sig.dg_tag_sig);
    require (b.b_dg_tag, "Diff Gen Equal tag vs acc_d does not pass");

    /// @dev 3. verify Part Equal signature (T_beg, T_end, opn) vs acc_d 
    uint256[] memory pe_y = new uint256[](n);
    pe_y[n-5] = tx_sp.attrS[1]; // T_beg
    pe_y[n-4] = tx_sp.attrS[2]; // T_end
    pe_y[n-2] = tx_sp.attrS[0]; // opn
    alt_bn128.G1Point memory Cy = pp.Com(pe_y);

    uint256[] memory idx_ne = new uint256[](n-3);
    for (uint i = 0; i < n-5; i++){
      idx_ne[i] = i;
    }
    idx_ne[n-5] = n-3;
    idx_ne[n-4] = n-1;

    b.b_pe_opn = pe.verify(Gs, idx_ne, sig.acc_d, Cy, sig.pe_opn_sig);
    require (b.b_pe_opn, "Part Equal signature (same T_beg, T_end, opn) does not pass");

    /// @dev 4. Part Equal signatures (same tyS, valS)
    /// @dev 5. Diff Gen Equal signatures (pkT vs comT) 
    uint target_length = tx_sp.tcom_T.length;

    b.b_pe_ty = new bool[](target_length);
    b.b_dg_sk = new bool[](target_length);

    idx_ne = new uint256[](5);
    for (uint i = 0; i < 5; i++){
      idx_ne[i] = n-5+i;
    }

    for (uint i = 0; i < target_length; i++){
      Cy = tx_sp.tcom_T[i].add(tx_sp.ocom_T[i]);

      b.b_pe_ty[i] = pe.verify(Gs, idx_ne, sig.acc_d, Cy, sig.pe_ty_sig[i]);
      require (b.b_pe_ty[i], "Part Equal signatures (same tyS, valS) does not pass");

      b.b_dg_sk[i] = dg.verify(pp.g_pk(), Gs, pp.sk_pos(), tx_sp.pk_T, Cy, sig.dg_sk_sig[i]);
      require (b.b_dg_sk[i], "Diff Gen Equal signatures (pkT vs comT) does not pass");
    }

  }
}