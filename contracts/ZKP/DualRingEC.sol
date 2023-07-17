// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "./DualRing.sol";
import "./NISA.sol";

contract DualRingEC is DualRing {
    using alt_bn128 for uint256;
	using alt_bn128 for alt_bn128.G1Point;
    using alt_bn128 for alt_bn128.G1Point[];

    NISA private nisa;

    /// @param dr_pp {g, pks}
    /// @param u random generator
    struct ParamEC {
        DualRing.Param dr_pp;
        alt_bn128.G1Point u;
    }

    // struct ParamEC {
    //     alt_bn128.G1Point g;
    //     alt_bn128.G1Point[] pks;
    //     alt_bn128.G1Point u;
    // }

    /// @param z response
    /// @param R g^r * prod_{i != j} pk_i^{c_i} 
    /// @param nisa_sig shortened signature
    struct SigEC{
        uint256 z;
        alt_bn128.G1Point R;
        NISA.Sig nisa_sig;
    }

    constructor () {
        nisa = new NISA();
    }

    /// @dev setup a ring
    /// @param ring_size ring size
    /// @param skj [sk, index]
    function setupEC(uint256 ring_size, uint256[2] memory skj) public view returns (ParamEC memory pp){
        // DualRing.Param memory p = DualRing.setup(ring_size, skj);
        pp.dr_pp = DualRing.setup(ring_size, skj);
        pp.u = alt_bn128.random().uintToCurvePoint();
        // pp = ParamEC({
        //     g : p.g,
        //     pks : p.pks,
        //     u : alt_bn128.random().uintToCurvePoint()
        // });
    }

    function param(
        alt_bn128.G1Point memory g, 
        alt_bn128.G1Point[] memory pks, 
        alt_bn128.G1Point memory u) 
    public pure returns (ParamEC memory) {
        return ParamEC({
            dr_pp : DualRing.Param(g, pks),
            u : u
        });
    }
    
    /// @dev sign a dualring signature on message m
    function signEC(ParamEC memory pp, bytes memory m, uint256[2] memory skj) public view returns (SigEC memory sig) {
        DualRing.Sig memory dr_sig; 
        uint256 c;
        alt_bn128.G1Point memory R; 
        (dr_sig, c, R) = DualRing.sign(pp.dr_pp, m, skj);
        // (dr_sig, c, R) = DualRing.sign(DualRing.Param(pp.g, pp.pks), m, skj);

        NISA.Param memory nisa_pp = NISA.Param({
            Gs : pp.dr_pp.pks,
            P : R.add(pp.dr_pp.g.mul(dr_sig.z).neg()),
            // Gs : pp.pks,
            // P : R.add(pp.g.mul(dr_sig.z).neg()),
            u : pp.u,
            c : c  
        });
        /// @dev reduce signature size by NISA (bulletproof)
        NISA.Sig memory nisa_sig = nisa.prove(nisa_pp, dr_sig.cs); 
        // NISA.Sig memory nisa_sig = NISA.prove(nisa_pp, dr_sig.cs); 

        sig = SigEC({
            z : dr_sig.z,
            R : R,
            nisa_sig : nisa_sig
        });
    }

    /// @dev verify a dualring signature on message m
    function verifyEC(ParamEC memory pp, bytes memory m, SigEC memory sig) public view returns (bool) {
        uint256 c = H(m, pp.dr_pp.pks, sig.R);
        alt_bn128.G1Point memory P = sig.R.add(pp.dr_pp.g.mul(sig.z).neg());
        // uint256 c = H(m, pp.pks, sig.R);
        // alt_bn128.G1Point memory P = sig.R.add(pp.g.mul(sig.z).neg());

        NISA.Param memory nisa_pp = NISA.Param({
            Gs : pp.dr_pp.pks,
            // Gs : pp.pks,
            P : P,
            u : pp.u,
            c : c
        });
        require(nisa.verify(nisa_pp, sig.nisa_sig), "DualRingEC failed");
        // require(NISA.verify(nisa_pp, sig.nisa_sig), "DualRingEC failed");

        return true;
    }
}