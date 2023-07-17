// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";
import "./Token/Token.sol";
import "./Token/TokenRegistrar.sol";
import "./PubParam.sol";
import {PartialEquality as PE} from "./ZKP/PartialEquality.sol";
// import {DualRingEC as DR} from "./ZKP/DualRingEC.sol";
// import {DiffGenEqual as DG} from "./ZKP/DiffGenEqual.sol";
import "./TX/SoKwd.sol";

contract Mixer {
  
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  alt_bn128.G1Point[] _accs;
  alt_bn128.G1Point[] _pks;
  alt_bn128.G1Point[] _tags;

  TokenRegistrar r;
  PubParam pp;
  PE pe;
  SoKwd wd;

  constructor (address r_addr, address pp_addr, address pe_addr, address wd_addr) {
    r = TokenRegistrar(r_addr);
    pp = PubParam(pp_addr);
    // pe = new PE();
    pe = PE(pe_addr);
    wd = SoKwd(wd_addr);
    // wd = new SoKwd(address(pp));
  }


  ///////// deposit /////////

  struct TX_dp {
    PubParam.Acc s; /// @dev (pk, tcom, ocom)
    uint256[] attrS; /// @dev (ty, val, t_beg, t_end)
  }

  struct Sig_dp {
    PE.Sig pe_sig;
  }

  
  /// @dev user deposit token into mixer
  /// @param tx_dp deposit transaction statement
  /// @param wit witness (sk, opn, ok)
  /// @return sig deposit signature
  function deposit(TX_dp memory tx_dp, uint256[3] memory wit) public returns (Sig_dp memory sig){

    Token t = Token(r.getToken(tx_dp.attrS[0]));

    if (!t.approve(address(this), tx_dp.attrS[1])) revert ("Unsuccessful approve operation");

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

    // PE pe = new PE();

    PE.Sig memory pe_sig = pe.sign(pp.gs(), x, y, ine);

    sig = Sig_dp({
      pe_sig : pe_sig
    });
    
  }

  /// @dev mixer process deposit request
  /// @param tx_dp deposit transaction statement
  /// @param sig deposit signature
  function process_dp(TX_dp memory tx_dp, Sig_dp memory sig) public returns (bool) {
    uint256 time = block.timestamp;
    /// @dev T_now /in [T_beg, T_end)
    bool b0 = tx_dp.attrS[2] <= time && time < tx_dp.attrS[3]; 
    /// @dev pk /notin pks
    bool b1 = !_contains(_pks, tx_dp.s.pk);

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

    bool b2 = pe.verify(pp.gs(), ine, Cx, Cy, sig.pe_sig);

    if (b0 && b1 && b2){
      _accs.push(Cx);
      _pks.push(tx_dp.s.pk);
      Token t = Token(r.getToken(tx_dp.attrS[0]));
      // require (t.ownerOf(tx_dp.attrS[1]) == msg.sender, "Correct ownership");

      return t.transfer(msg.sender, address(this), tx_dp.attrS[1]);
    }
    return false;
  }

  ///////// withdraw //////////

/*
  /// @param R ring accounts
  /// @param tag tag = g_tag^sk
  /// @param attrS (ty, val, t_beg, t_end)
  /// @param u_rcpt receipt address
  */
  // struct TX_wd {
  //   alt_bn128.G1Point[] R; 
  //   alt_bn128.G1Point tag;
  //   uint256[] attrS;
  //   address u_rcpt;
  // }

  // struct Sig_wd {
  //   alt_bn128.G1Point acc_d;
  //   DR.SigEC dr_sig;
  //   DG.Sig dg_sig;
  //   PE.Sig pe_sig;
  // }

  /// @dev withdraw token from mixer
  /// @param tx_wd withdraw transaction statement
  /// @param wit (theta, sk, opn, ok)
  function withdraw(SoKwd.TX_wd memory tx_wd, uint256[4] memory wit) public view returns (SoKwd.Sig_wd memory sig){
    
    return wd.sign(tx_wd, wit);

    // require (tx_wd.tag.eq(pp.TagEval(wit[1])), "Tag matches");

    // uint n = pp.n();
    // uint pub_l = tx_wd.attrS.length;
    // uint ne_l = n-tx_wd.attrS.length;

    // uint256[] memory acc_d_attr = new uint256[](n);
    // uint256[] memory y = new uint256[](n);
    // uint256[] memory i_ne = new uint256[](ne_l);

    // for (uint i = 0; i < pub_l; i++) {
    //   acc_d_attr[i] = tx_wd.attrS[i];
    //   y[i] = tx_wd.attrS[i];
    // }

    // for (uint i = 0; i < ne_l; i++) {
    //   acc_d_attr[pub_l+i] = wit[1+i]; // (sk, opn, ok)
    //   i_ne[i] = pub_l + i; // [4,5,6]
    // }

    // acc_d_attr[n-1] = alt_bn128.random(); // acc_d ok'

    // alt_bn128.G1Point memory acc_d = pp.Com(acc_d_attr); // acc_d
    // sig.acc_d = acc_d;

    // // alt_bn128.G1Point[] memory new_R = new alt_bn128.G1Point[](tx_wd.R.length); // ring pks

    // for (uint i = 0; i < tx_wd.R.length; i++) {
    //   tx_wd.R[i] = tx_wd.R[i].add(acc_d.neg()); // ring pks := {acc/acc_d}
    // }

    // DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_wd.R, pp.h());
    // bytes memory m = abi.encode(tx_wd.u_rcpt);
    // uint256[2] memory skj = [wit[3].sub(acc_d_attr[n-1]), wit[0]]; // (ok-ok', theta)

    // /// @dev Ring signature {acc/acc_d}
    // sig.dr_sig = dr.signEC(dr_pp, m, skj);

    // /// @dev Diff Gen Equal signature (tag vs acc_d)
    // sig.dg_sig = dg.sign(pp.g_tag(), pp.gs(), 4, acc_d_attr);

    // /// @dev Partial Equality signature (acc_d vs pub)
    // sig.pe_sig = pe.sign(pp.gs(), acc_d_attr, y, i_ne);

  }

  function process_wd(SoKwd.TX_wd memory tx_wd, SoKwd.Sig_wd memory sig) public returns (bool) {
    uint256 time = block.timestamp;
    bool b0 = tx_wd.attrS[2] <= time && time < tx_wd.attrS[3]; // T_now /in [T_beg, T_end)

    for (uint i = 0; i < tx_wd.R.length; i++) {
      tx_wd.R[i] = tx_wd.R[i].add(sig.acc_d.neg()); // ring pks := {acc/acc_d}
    }

    bool b1 = wd.verify_wd_sigs(tx_wd, sig);
    require (b1, "signature failed");

    /// @dev tag /notin _tags
    bool b2 = !_contains(_tags, tx_wd.tag);

    if (b0 && b1 && b2) {
      _tags.push(tx_wd.tag);

      Token t = Token(r.getToken(tx_wd.attrS[0]));
      /// @dev ty.transfer[mixer, rcpt]
      return t.transfer(address(this), tx_wd.u_rcpt, tx_wd.attrS[1]);

    }
    return false;

  }

  // function verify_wd_sigs(TX_wd memory tx_wd, Sig_wd memory sig) private view returns (bool) {
  //   DR.ParamEC memory dr_pp = dr.param(pp.g_ok(), tx_wd.R, pp.h());
  //   bytes memory m = abi.encode(tx_wd.u_rcpt);

  //   /// @dev verify Ring signature
  //   bool b_dr = dr.verifyEC(dr_pp, m, sig.dr_sig);
  //   require (b_dr, "Ring signature does not pass");

  //   /// @dev verify Diff Gen Equal signature
  //   bool b_dg = dg.verify(pp.g_tag(), pp.gs(), 4, tx_wd.tag, sig.acc_d, sig.dg_sig);
  //   require (b_dg, "Diff Gen Equal signature does not pass");

  //   uint256[] memory y = new uint256[](pp.n());
  //   for (uint i = 0; i < tx_wd.attrS.length; i++) {
  //     y[i] = tx_wd.attrS[i];
  //   }
  //   alt_bn128.G1Point memory Cy = pp.Com(y);

  //   uint256[] memory ine = new uint256[](pp.n() - tx_wd.attrS.length);
  //   for (uint i = 0; i < ine.length; i++) {
  //     ine[i] = i+tx_wd.attrS.length; // [4,5,6]
  //   }

  //   /// @dev verify Partial Equality signature
  //   bool b_pe = pe.verify(pp.gs(), ine, sig.acc_d, Cy, sig.pe_sig);
  //   require (b_pe, "Partial Equality signature does not pass");

  //   return b_dr && b_dg && b_pe;
  // }



  function spend() public pure returns (bool){

  }

  function _contains(alt_bn128.G1Point[] memory ls, alt_bn128.G1Point memory pk) internal pure returns (bool) {
    for (uint i = 0 ; i < ls.length; i++) {
      if (alt_bn128.eq(ls[i], pk)) return true;
    }
    // for (uint i = 0 ; i < _pks.length; i++) {
    //   if (alt_bn128.eq(_pks[i], pk)) return true;
    // }
    return false;
  }



}