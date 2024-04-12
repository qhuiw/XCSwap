// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";

import {PartialEquality as PE} from "../ZKP/PartialEquality.sol";
import {DiffGenEqual as DG} from "../ZKP/DiffGenEqual.sol";
import {Sigma as SG} from "../ZKP/Sigma.sol";

contract SoKba {
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  PubParam pp;
  PE pe;
  DG dg;
  SG sg;

  constructor (address _pp, address _pe, address _dg, address _sg) {
    pp = PubParam(_pp);
    pe = PE(_pe);
    dg = DG(_dg);
    sg = SG(_sg);
  }

  /// @param common (y,valy,T2,T3,Tmax,s)
  /// @param pky pk of user B
  /// @param tcomEy commitment of token info of E account of token y
  /// @param ocomEx commitment of info to be opened at the time of spending the E account of token x
  /// @param rBy commitment of R account of token y
  struct Stm {
    uint256[6] common;
    alt_bn128.G1Point pky;
    alt_bn128.G1Point tcomEy;
    alt_bn128.G1Point ocomEx;
    alt_bn128.G1Point rBy;
  }

  struct Sig {
    PE.Sig pe_tcom_sig;
    DG.Sig dg_sig;
    SG.Sig sg_sig;
    PE.Sig pe_R_sig;
    DG.Sig dg_R_sig;
  }

  /// @dev sok L_{ba} sign by user B
  /// @param wit (s, b1^, b2, b3, b4)
  function sign(Stm memory stm, uint256[5] memory wit) public view returns (Sig memory sig) {
    alt_bn128.G1Point[] memory Gs = pp.gs();
    uint n = pp.n();
    uint sk_pos = pp.sk_pos();

    uint256[] memory com_attr = new uint256[](1);
    com_attr[0] = wit[1]; // b1^
    alt_bn128.G1Point[] memory uneq_gs = new alt_bn128.G1Point[](1);
    uneq_gs[0] = Gs[sk_pos];

    /// @dev 1. Part Equal signature (same y, valy, T2, T3)
    sig.pe_tcom_sig = pe.sign(uneq_gs, com_attr, new uint256[](1));

    com_attr = new uint256[](n);
    for (uint i=0; i<4; i++) {
      com_attr[i] = stm.common[i];
    }
    com_attr[4] = wit[1]; // b1^
    /// @dev 2. Diff Gen Equal (pky vs tcomy)
    sig.dg_sig = dg.sign(pp.g_pk(), Gs, sk_pos, 0, com_attr);

    com_attr = new uint256[](2);
    com_attr[0] = wit[1] + wit[0]; // b1^ + s
    com_attr[1] = wit[4];

    uneq_gs = new alt_bn128.G1Point[](2);
    uneq_gs[0] = Gs[sk_pos+1];
    uneq_gs[1] = Gs[sk_pos+2];
    /// @dev 3. SigmaSum (b1^ + s)
    sig.sg_sig = sg.signSum(uneq_gs, com_attr, [wit[0], 0]);

    uneq_gs = new alt_bn128.G1Point[](3);
    for (uint i=0; i<3; i++) {
      uneq_gs[i] = Gs[sk_pos+i];
    }

    // [b1, b2, b3]
    com_attr = new uint256[](3);
    for (uint i=0; i<3; i++) {
      com_attr[i] = wit[1+i];
    }
    /// @dev 4. Part Equal signature (same y, valy, T3, Tmax)
    sig.pe_R_sig = pe.sign(uneq_gs, com_attr, new uint256[](3));

    // [y,valy,T3,Tmax,b1,b2;b3]
    com_attr = new uint256[](n);
    com_attr[0] = stm.common[0];
    com_attr[1] = stm.common[1];
    com_attr[2] = stm.common[3];
    com_attr[3] = stm.common[4];
    for (uint i=0; i<3; i++) {
      com_attr[4+i] = wit[1+i];
    }
    /// @dev 5. Diff Gen Equal (pky vs R)
    sig.dg_R_sig = dg.sign(pp.g_pk(), Gs, sk_pos, 0, com_attr);
  }

  struct RTN {
    bool b_pe_tcom;
    bool b_dg;
    bool b_sg;
    bool b_pe_R;
    bool b_dg_R;
  }
  
  /// @dev sok L_{ba} verify by user A
  function verify(Stm memory stm, Sig memory sig) public view returns (bool) {
    RTN memory rtn = verify_(stm, sig);
    return rtn.b_pe_tcom && rtn.b_dg && rtn.b_sg && rtn.b_pe_R && rtn.b_dg_R;
  }

  function verify_(Stm memory stm, Sig memory sig) private view returns (RTN memory rtn) {
    alt_bn128.G1Point[] memory Gs = pp.gs();
    uint n = pp.n();
    uint sk_pos = pp.sk_pos();

    uint256[] memory pe_y = new uint256[](n);
    for (uint i=0; i<4; i++) {
      pe_y[i] = stm.common[i];
    }
    alt_bn128.G1Point memory Cy = pp.tCom(pe_y);

    alt_bn128.G1Point[] memory uneq_gs = new alt_bn128.G1Point[](1);
    uneq_gs[0] = Gs[sk_pos];

    /// @dev 1. Part Equal signature (same y, valy, T2, T3)
    rtn.b_pe_tcom = pe.verify(uneq_gs, stm.tcomEy, Cy, sig.pe_tcom_sig);
    require(rtn.b_pe_tcom, "SoKba : Part Equal tcom failed");

    /// @dev 2. Diff Gen Equal (pky vs tcomy)
    rtn.b_dg = dg.verify(pp.g_pk(), Gs, sk_pos, stm.pky, stm.tcomEy, sig.dg_sig);
    require(rtn.b_dg, "Diff Gen Equal tcom failed");

    uneq_gs = new alt_bn128.G1Point[](2);
    uneq_gs[0] = Gs[sk_pos+1];
    uneq_gs[1] = Gs[sk_pos+2];
    /// @dev 3. SigmaSum (b1^ + s)
    rtn.b_sg = sg.verifySum(uneq_gs, stm.ocomEx, sig.sg_sig, [stm.common[5], 0]); // [s, 0]
    require(rtn.b_sg, "SigmaSum does not pass");

    uneq_gs = new alt_bn128.G1Point[](3);
    for (uint i=0; i<3; i++) {
      uneq_gs[i] = Gs[sk_pos+i];
    }

    pe_y[2] = stm.common[3]; // T3
    pe_y[3] = stm.common[4]; // Tmax
    Cy = pp.tCom(pe_y);
    /// @dev 4. Part Equal signature (same y, valy, T3, Tmax)
    rtn.b_pe_R = pe.verify(uneq_gs, stm.rBy, Cy, sig.pe_R_sig);
    require(rtn.b_pe_R, "SoKba : Part Equal R failed");

    /// @dev 5. Diff Gen Equal (pky vs R)
    rtn.b_dg_R = dg.verify(pp.g_pk(), Gs, sk_pos, stm.pky, stm.rBy, sig.dg_R_sig);
    require(rtn.b_dg_R, "SoKba: Diff Gen Equal R failed");
  }

}
