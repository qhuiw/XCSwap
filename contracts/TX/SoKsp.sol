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

  constructor (address pp_addr) {
    pp = PubParam(pp_addr);
    pe = new PE();
    dr = new DR();
    dg = new DG();
  }

  struct TX {
    alt_bn128.G1Point[] R;
    alt_bn128.G1Point tagS;
    uint256[3] attrS; // (opnS, T_beg, T_end)
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
    uint256[][4] attrTs;
  }

  struct Sig {
    alt_bn128.G1Point acc_d;
    DR.SigEC dr_sig;
    DG.Sig dg_tag_sig;
    PE.Sig pe_opn_sig;
    PE.Sig[] pe_ty_sig;
    DG.Sig[] dg_sk_sig;
  }

  function sign(TX memory tx_sp, Wit memory wit) public returns (Sig memory sig) {
    uint n = pp.n();

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
      tx_sp.R[i] = tx_sp.R[i].add(acc_d.neg()); // ring pks := {acc/acc_d}
    }

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_sp.R, pp.h());
    bytes memory m = abi.encode("");
    uint256[2] memory skj = [wit.attrS[n-4].sub(acc_d_attr[n-1]), wit.theta]; // (ok-ok', theta)

    /// @dev 1. Ring signature {acc/acc_d}
    sig.dr_sig = dr.signEC(dr_pp, m, skj);

    alt_bn128.G1Point[] memory Gs = pp.gs();

    /// @dev 2. Diff Gen Equal signature (tag vs acc_d)
    sig.dg_tag_sig = dg.sign(pp.g_tag(), Gs, pp.sk_pos(), acc_d_attr);

    /// @dev 3. Part Equal signature (same T_beg, T_end, opn)
    uint256[] memory pe_x = new uint256[](n);
    pe_x[n-5] = tx_sp.attrS[1]; // T_beg
    pe_x[n-4] = tx_sp.attrS[2]; // T_end
    pe_x[n-2] = tx_sp.attrS[0]; // opn
    uint256[] memory idx_ne = new uint256[](3);
    idx_ne[0] = n-5;
    idx_ne[1] = n-4;
    idx_ne[2] = n-2;

    sig.pe_opn_sig = pe.sign(Gs, pe_x, acc_d_attr, idx_ne);

    /// @dev 4. Part Equal signatures (same tyS, valS)
    /// @dev 5. Diff Gen Equal signatures (pkT vs comT) 
    uint target_length = tx_sp.tcom_T.length;

    sig.pe_ty_sig = new PE.Sig[](target_length);
    sig.dg_sk_sig = new DG.Sig[](target_length);

    pe_x = new uint256[](n);
    for (uint i = 0; i < pp.sk_pos(); i++){
      pe_x[i] = wit.attrS[i];
    }

    idx_ne = new uint256[](5);
    for (uint i = 0; i < 5; i++){
      idx_ne[i] = n-5+i;
    }

    pe_x[n-3] = wit.sk_T;

    for (uint i = 0; i < target_length; i++){
      pe_x[n-5] = wit.attrTs[i][0]; // T_beg
      pe_x[n-4] = wit.attrTs[i][1]; // T_end
      pe_x[n-2] = wit.attrTs[i][2]; // opn
      pe_x[n-1] = wit.attrTs[i][3]; // ok

      sig.pe_ty_sig[i] = pe.sign(Gs, pe_x, acc_d_attr, idx_ne);
      sig.dg_sk_sig[i] = dg.sign(pp.g_pk(), Gs, pp.sk_pos(), pe_x);
    }

    // / @dev Diff Gen Equal signatures (pkT vs tcomT)
    // alt_bn128.G1Point[] memory gs = new alt_bn128.G1Point[](n-2);
    // for (uint i = 0; i < gs.length; i++){
    //   gs[i] = Gs[i];
    // }

    // uint256[] memory dg_sk_wit = new uint256[](n-2);
    // /// @dev rmb to generalise index afterwards
    // dg_sk_wit[0] = wit.attrS[0]; // ty
    // dg_sk_wit[1] = wit.attrS[1]; // val
    // dg_sk_wit[5] = wit.sk_T; // sk
    
    // for (uint i = 0; i < target_length; i++){
    //   dg_sk_wit[2] = wit.attrTs[i][0]; // T_beg
    //   dg_sk_wit[3] = wit.attrTs[i][1]; // T_end
    //   sig.dg_sk_sig[i] = dg.sign(pp.g_pk(), gs, pp.sk_pos(), dg_sk_wit);
    // }
  }

  // struct RTN {
  //   bool b_dr;
  //   bool b_dg_tag;
  //   bool b_pe_opn;
  //   bool[] b_pe_ty;
  //   bool[] b_dg_sk;
  // }

  function verify(TX memory tx_sp, Sig memory sig) public returns (bool) {
    RTN memory b = verify_(tx_sp, sig);
    
  }

  function verify_(TX memory tx_sp, Sig memory sig) public returns () {
    RTN memory b = new RTN

    DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_sp.R, pp.h());
    bytes memory m = abi.encode("");

    /// @dev 1. verify Ring signature
    b.b_dr = dr.verifyEC(dr_pp, m, sig.dr_sig);
    require (b.b_dr, "Ring signature does not pass");

    /// @dev 2. verify Diff Gen Equal signature (tag vs acc_d)
    alt_bn128.G1Point[] memory Gs = pp.gs();

    bool b_dg_tag = dg.verify(pp.g_tag(), Gs, pp.sk_pos(), tx_sp.tagS, sig.acc_d, sig.dg_tag_sig);
    require (b_dg_tag, "Diff Gen Equal tag vs acc_d does not pass");

    /// @dev 3. verify Part Equal signature (T_beg, T_end, opn)
    uint n = pp.n();
    uint256[] memory pe_x = new uint256[](n);
    pe_x[n-5] = tx_sp.attrS[1]; // T_beg
    pe_x[n-4] = tx_sp.attrS[2]; // T_end
    pe_x[n-2] = tx_sp.attrS[0]; // opn
    alt_bn128.G1Point memory Cx = pp.Com(pe_x);
    uint256[] memory idx_ne = new uint256[](3);
    idx_ne[0] = n-5;
    idx_ne[1] = n-4;
    idx_ne[2] = n-2;

    bool b_pe_opn = pe.verify(Gs, idx_ne, Cx, sig.acc_d, sig.pe_opn_sig);
    require (b_pe_opn, "Part Equal signature (same T_beg, T_end, opn) does not pass");

    /// @dev 4. Part Equal signatures (same tyS, valS)
    /// @dev 5. Diff Gen Equal signatures (pkT vs comT) 
    uint target_length = tx_sp.tcom_T.length;

    bool[] memory b_pe_ty = new bool[](target_length);
    bool[] memory b_dg_sk = new bool[](target_length);

    idx_ne = new uint256[](5);
    for (uint i = 0; i < 5; i++){
      idx_ne[i] = n-5+i;
    }

    for (uint i = 0; i < target_length; i++){
      Cx = tx_sp.tcom_T[i].add(tx_sp.ocom_T[i]);

      b_pe_ty[i] = pe.verify(Gs, idx_ne, Cx, sig.acc_d, sig.pe_ty_sig[i]);
      require (b_pe_ty[i], "Part Equal signatures (same tyS, valS) does not pass");

      b_dg_sk[i] = dg.verify(pp.g_pk(), Gs, pp.sk_pos(), tx_sp.pk_T, Cx, sig.dg_sk_sig[i]);
      require (b_dg_sk[i], "Diff Gen Equal signatures (pkT vs comT) does not pass");
    }



  }


}