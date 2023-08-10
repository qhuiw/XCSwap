// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "../PubParam.sol";

import {PartialEquality as PE} from "../ZKP/PartialEquality.sol";
import {DiffGenEqual as DG} from "../ZKP/DiffGenEqual.sol";
import {Sigma as SG} from "../ZKP/Sigma.sol";

contract SoKab {
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

  /// @param common (x,valx,T1,T2,Tmax)
  /// @param pkx pk of user A
  /// @param tcomEx commitment of token info of E account of token x
  /// @param ocomEy commitment of info to be opened at the time of spending the E account of token y
  /// @param rAx commitment of R account of token x
  struct Stm {
    uint256[5] common;
    alt_bn128.G1Point pkx;
    alt_bn128.G1Point tcomEx;
    alt_bn128.G1Point ocomEy;
    alt_bn128.G1Point rAx;
  }

  struct Sig {
    PE.Sig pe_tcom_sig;
    DG.Sig dg_sig;
    SG.Sig sg_sig;
    PE.Sig pe_R_sig;
    DG.Sig dg_R_sig;
  }

  /// @dev sok L_{ab} sign by user A
  /// @param stm public statement of L_{ab}
  /// @param wit (a1^, a2, a3, a4, a5)
  function sign(Stm memory stm, uint256[5] memory wit) public view returns (Sig memory sig) {
    alt_bn128.G1Point[] memory Gs = pp.gs();
    uint n = pp.n();

    uint256[] memory com_attr = new uint256[](1);
    com_attr[0] = wit[0]; // a1^
    alt_bn128.G1Point[] memory uneq_gs = new alt_bn128.G1Point[](1);
    uneq_gs[0] = Gs[pp.sk_pos()];

    /// @dev 1. Part Equal signature (same x, valx, T1, T2)
    sig.pe_tcom_sig = pe.sign(uneq_gs, com_attr, new uint256[](1));

    com_attr = new uint256[](n);
    for (uint i=0; i<4; i++) {
      com_attr[i] = stm.common[i];
    }
    com_attr[4] = wit[0]; // a1^
    /// @dev 2. Diff Gen Equal (pkx vs tcomx)
    sig.dg_sig = dg.sign(pp.g_pk(), Gs, pp.sk_pos(), com_attr);

    com_attr = new uint256[](2);
    com_attr[0] = wit[1]; // a2
    com_attr[1] = wit[2]; // a3

    uneq_gs = new alt_bn128.G1Point[](2);
    uneq_gs[0] = Gs[pp.sk_pos()+1];
    uneq_gs[1] = Gs[pp.sk_pos()+2];
    /// @dev 3. plain Sigma (a2, a3)
    sig.sg_sig = sg.sign(uneq_gs, com_attr);

    uneq_gs = new alt_bn128.G1Point[](3);
    for (uint i=0; i<3; i++) {
      uneq_gs[i] = Gs[pp.sk_pos()+i];
    }

    // [a1^, a4, a5]
    com_attr = new uint256[](3);
    com_attr[0] = wit[0]; // a1^
    com_attr[1] = wit[3]; // a4
    com_attr[2] = wit[4]; // a5

    /// @dev 4. Part Equal signature (same x, valx, T2, Tmax)
    sig.pe_R_sig = pe.sign(uneq_gs, com_attr, new uint256[](3));

    // [x, valx, T2, Tmax, a1^, a4, a5]
    com_attr = new uint256[](n);
    com_attr[0] = stm.common[0];
    com_attr[1] = stm.common[1];
    com_attr[2] = stm.common[3];
    com_attr[3] = stm.common[4];
    com_attr[4] = wit[0]; // a1^
    com_attr[5] = wit[3]; // a4
    com_attr[6] = wit[4]; // a5

    /// @dev 5. Diff Gen Equal (pkx vs R)
    sig.dg_R_sig = dg.sign(pp.g_pk(), Gs, pp.sk_pos(), com_attr);
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

  /// @dev sok L_{ab} verify by user A
  /// @param stm public statement of L_{ab}
  /// @param sig L_{ab} signature
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

    /// @dev 1. Part Equal signature (same x, valx, T1, T2)
    rtn.b_pe_tcom = pe.verify(uneq_gs, stm.tcomEx, Cy, sig.pe_tcom_sig);
    require(rtn.b_pe_tcom, "SoKab: Part Equal tcom failed");

    /// @dev 2. Diff Gen Equal (pkx vs tcomx)
    rtn.b_dg = dg.verify(pp.g_pk(), Gs, sk_pos, stm.pkx, stm.tcomEx, sig.dg_sig);
    require(rtn.b_dg, "SoKab: Diff Gen Equal tcom failed");

    uneq_gs = new alt_bn128.G1Point[](2);
    uneq_gs[0] = Gs[sk_pos+1];
    uneq_gs[1] = Gs[sk_pos+2];

    /// @dev 3. plain Sigma (a2, a3)
    rtn.b_sg = sg.verify(uneq_gs, stm.ocomEy, sig.sg_sig);
    require(rtn.b_sg, "SoKab: Sigma failed");

    uneq_gs = new alt_bn128.G1Point[](3);
    for (uint i=0; i<3; i++) {
      uneq_gs[i] = Gs[sk_pos+i];
    }

    pe_y[2] = stm.common[3]; // T2
    pe_y[3] = stm.common[4]; // Tmax
    Cy = pp.tCom(pe_y);
    /// @dev 4. Part Equal signature (same x, valx, T2, Tmax)
    rtn.b_pe_R = pe.verify(uneq_gs, stm.rAx, Cy, sig.pe_R_sig);
    require(rtn.b_pe_R, "SoKab: Part Equal R failed");

    /// @dev 5. Diff Gen Equal (pkx vs R)
    rtn.b_dg_R = dg.verify(pp.g_pk(), Gs, sk_pos, stm.pkx, stm.rAx, sig.dg_R_sig);
    require(rtn.b_dg_R, "SoKab: Diff Gen Equal R failed");
  }

}