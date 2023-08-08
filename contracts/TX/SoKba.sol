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

  /// @param common (x,valx,y,valy,T1,T2,T3,Tmax)
  struct Stm {
    uint256[8] common;
    alt_bn128.G1Point tcomEy;
    alt_bn128.G1Point ocomEx;
    alt_bn128.G1Point RyB;
  }

  struct Sig {
    PE.Sig pe_tcom_sig;
    DG.Sig dg_sig;
    PE.Sig R_sig;
  }

  /// @dev sok L_{ba} sign

  function sign (Stm memory stm, uint256[5] memory wit) public view returns (Sig memory sig) {

    


  }




  function sigma_sign() public pure {

  }


  // function sigma_verify()


}
