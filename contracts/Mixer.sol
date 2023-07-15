// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";
import "./Token/Token.sol";
import "./Token/TokenRegistrar.sol";
import "./PubParam.sol";
import {PartialEquality as PE} from "./ZKP/PartialEquality.sol";
import {DualRingEC as DR} from "./ZKP/DualRingEC.sol";
import {DiffGen as DG} from "./ZKP/DiffGen.sol";

contract Mixer {
  
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  alt_bn128.G1Point[] _accs;
  alt_bn128.G1Point[] _pks;
  alt_bn128.G1Point[] tags;

  TokenRegistrar r;
  PubParam pp;
  PE pe;
  DR dr;

  constructor (address r_addr, address pp_addr) {
    r = TokenRegistrar(r_addr);
    pp = PubParam(pp_addr);
    pe = new PE();
    dr = new DR();
  }

  struct TX_dp {
    // alt_bn128.G1Point acc;
    PubParam.Acc s; /// @dev (pk, tcom, ocom)
    uint256[] attr; /// @dev (ty, val, t_beg, t_end)
  }

  struct Sig_dp {
    PE.Sig pe_sig;
  }

  
  /// @dev user deposit token into mixer
  /// @param tx_dp transaction statement
  /// @param wit witness (sk, opn, ok)
  /// @return sig deposit signature
  function deposit(TX_dp memory tx_dp, uint256[3] memory wit) public returns (Sig_dp memory sig){

    Token t = Token(r.getToken(tx_dp.attr[0]));

    if (!t.approve(address(this), tx_dp.attr[1])) revert ("Unsuccessful approve operation");

    uint n = pp.n();

    uint256[] memory x = new uint256[](n);
    uint256[] memory y = new uint256[](n);
    uint256[] memory ine = new uint256[](wit.length); // [4,5,6]

    for (uint i = 0; i < tx_dp.attr.length; i++){
      x[i] = tx_dp.attr[i];
      y[i] = tx_dp.attr[i];
    }

    for (uint i = 0; i < wit.length; i++) {
      x[i+tx_dp.attr.length] = wit[i];
      ine[i] = i + tx_dp.attr.length;
    }

    PE.Sig memory pe_sig = pe.sign(pp.gs(), x, y, ine);

    sig = Sig_dp({
      pe_sig : pe_sig
    });
    
  }

  function process_dp(TX_dp memory tx_dp, Sig_dp memory sig) public returns (bool) {
    uint256 time = block.timestamp;
    bool b0 = tx_dp.attr[2] <= time && time < tx_dp.attr[3]; // [T_beg, T_end)
    bool b1 = !_contains(_pks, tx_dp.s.pk);

    alt_bn128.G1Point memory Cx = tx_dp.s.tcom.add(tx_dp.s.ocom);

    uint256[] memory y = new uint256[](pp.n());
    for (uint i = 0; i < tx_dp.attr.length; i++) {
      y[i] = tx_dp.attr[i];
    }
    alt_bn128.G1Point memory Cy = pp.Com(y);

    uint256[] memory ine = new uint256[](pp.n() - tx_dp.attr.length);
    for (uint i = 0; i < ine.length; i++) {
      ine[i] = i+tx_dp.attr.length; // [4,5,6]
    }

    bool b2 = pe.verify(pp.gs(), ine, Cx, Cy, sig.pe_sig);

    if (b0 && b1 && b2){
      _accs.push(Cx);
      _pks.push(tx_dp.s.pk);
      Token t = Token(r.getToken(tx_dp.attr[0]));
      return t.transfer(msg.sender, address(this), tx_dp.attr[1]);
    }
    return false;
  }

  struct TX_wd {
    alt_bn128.G1Point[] R; /// @dev ring accounts
    uint256[] attrS; /// @dev (tag, ty, val, t_beg, t_end)
    address u_rcpt; /// @dev receipt address
  }

  struct Sig_wd {
    DR.Sig dr_sig;
  }

  /// @param wit (theta, sk, opn, ok)
  function withdrawal(TX_wd memory tx_wd, uint256[] memory wit) public view returns (bool){

    // generate acc_d
    uint256[] memory acc_d_attr = new uint256[](pp.n());
    for (uint i = 1; i < tx_wd.attrS.length; i++) {
      acc_d_attr[i-1] = tx_wd.attrS[i];
    }
    for (uint i = 0; i < wit.length; i++) {
      acc_d_attr[pp.n()-wit.length+i] = wit[i];
    }
    alt_bn128.G1Point memory acc_d = pp.Com(acc_d_attr);

    alt_bn128.G1Point[] memory new_R = new alt_bn128.G1Point[](tx_wd.R.length); // ring pks

    for (uint i = 0; i < tx_wd.R.length; i++) {
      new_R[i] = tx_wd.R[i].add(acc_d.neg());
    }

    // DR.ParamEC memory dr_pp = DR.ParamEC({
    //   g : pp.g_pk(),
    //   pks : new_R,
    //   u : pp.h()
    // });


    return true;
  }

  // function process_wd (TX_wd memory tx_wd)

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