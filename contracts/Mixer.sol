// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";
import "./Token/Token.sol";
import "./Token/TokenRegistrar.sol";
import "./PubParam.sol";
import {PartialEquality as PE} from "./ZKP/PartialEquality.sol";
import {DualRingEC as DR} from "./ZKP/DualRingEC.sol";
import {DiffGenEqual as DG} from "./ZKP/DiffGenEqual.sol";
import "./TX/SoKwd.sol";
import "./TX/SoKsp.sol";

contract Mixer {
  
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  alt_bn128.G1Point[] _accs;
  alt_bn128.G1Point[] _pks;
  alt_bn128.G1Point[] _tags;

  TokenRegistrar r;
  PubParam pp;
  PE pe;
  DR dr;
  DG dg;
  SoKwd wd;
  SoKsp sp;

  constructor (
    address r_addr, 
    address pp_addr, 
    address pe_addr, 
    address dr_addr,
    address dg_addr,
    address wd_addr,
    address sp_addr
  ) {
    r = TokenRegistrar(r_addr);
    pp = PubParam(pp_addr);
    pe = PE(pe_addr);
    dr = DR(dr_addr);
    dg = DG(dg_addr);
    // wd = new SoKwd(pp_addr, pe_addr, dr_addr, dg_addr);
    wd = SoKwd(wd_addr);
    sp = SoKsp(sp_addr);
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

    if (!t.approve(address(this), tx_dp.attrS[1])) 
      revert ("Unsuccessful approve operation");

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
    bool b1 = !_in(_pks, tx_dp.s.pk);

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
      return t.transfer(msg.sender, address(this), tx_dp.attrS[1]);
    }
    return false;
  }

  ///////// withdraw //////////

  /// @dev withdraw token from mixer
  /// @param tx_wd withdraw transaction statement
  /// @param wit (theta, sk, opn, ok)
  function withdraw(SoKwd.TX memory tx_wd, uint256[4] memory wit) public view returns (SoKwd.Sig memory){
    return wd.sign(tx_wd, wit);
  }
  
  function process_wd(SoKwd.TX memory tx_wd, SoKwd.Sig memory sig) public returns (bool) {
    uint256 time = block.timestamp;
    bool b0 = tx_wd.attrS[2] <= time && time < tx_wd.attrS[3]; // T_now /in [T_beg, T_end)

    bool b1 = wd.verify(tx_wd, sig);
    require (b1, "signature failed");

    /// @dev b2 ≜tagS ∉ Σtag
    bool b2 = !_in(_tags, tx_wd.tag);

    if (b0 && b1 && b2) {
      _tags.push(tx_wd.tag);

      Token t = Token(r.getToken(tx_wd.attrS[0]));
      /// @dev ty.transfer[mixer, rcpt]
      return t.transfer(address(this), tx_wd.u_rcpt, tx_wd.attrS[1]);
    }
    return false;
  }

  function spend(SoKsp.TX memory tx_sp, SoKsp.Wit memory wit) public view returns (SoKsp.Sig memory){
    return sp.sign(tx_sp, wit);
  }

  function process_sp(SoKsp.TX memory tx_sp, SoKsp.Sig memory sig) public returns (bool) {
    // uint256 time = 5; // for testing
    /// @dev b0 ≜ T_now ∈ [T_begS ,T_endS)
    uint256 time = block.timestamp;
    bool b0 = tx_sp.attrS[1] <= time && time < tx_sp.attrS[2]; 
    require (b0, "invalid transaction time");

    // b1 ≜ pkT ∉ Σpk
    bool b1 = !_in(_pks, tx_sp.pk_T);

    // b2 ≜ tagS ∉ Σtag
    bool b2 = !_in(_tags, tx_sp.tagS);

    bool b3 = sp.verify(tx_sp, sig);

    if (b0 && b1 && b2 && b3){
      _tags.push(tx_sp.tagS);
      _pks.push(tx_sp.pk_T);

      alt_bn128.G1Point memory acc;
      for (uint i = 0; i < tx_sp.ocom_T.length; i++) {
        acc = tx_sp.tcom_T[i].add(tx_sp.ocom_T[i]);
        _accs.push(acc);
      }
      return true;
    }
    return false;
  }

  function _in(
    alt_bn128.G1Point[] memory ls, 
    alt_bn128.G1Point memory pk
  ) internal pure returns (bool) {
    for (uint i = 0 ; i < ls.length; i++) {
      if (alt_bn128.eq(ls[i], pk)) return true;
    }
    return false;
  }



}