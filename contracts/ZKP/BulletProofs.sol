// SPDX-License-Identifier: GPL-3.0
/// developed by Xiangyu Hui
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract BulletProofs{
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point;

    struct Proof {
        alt_bn128.G1Point P;
        uint256 a;
        uint256 b;
        uint256 p;
        alt_bn128.G1Point[] Ls;
        alt_bn128.G1Point[] Rs;
    }

    struct GHs {
        alt_bn128.G1Point[] gL;
        alt_bn128.G1Point[] gR;
        alt_bn128.G1Point[] hL;
        alt_bn128.G1Point[] hR;
    }
    

    struct cons {
        uint256[] aL;
        uint256[] aR;
        uint256[] bL;
        uint256[] bR;
    }


    
    /// @param gs generators
    /// @param hs generators
    /// @param u single generator
    /// @param a witness 
    /// @param b witness 
    function prove(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        alt_bn128.G1Point memory u,
        uint256[] memory a,
        uint256[] memory b
    ) public view returns (Proof memory sig) {

        alt_bn128.G1Point memory gC = mulAndSum(gs,a);
        alt_bn128.G1Point memory hC = mulAndSum(hs,b);

        sig.P = gC.add(hC); 
        sig.p = innerProd(a,b);
        
        uint length = log2(a.length);

        GHs memory ghs;
        cons memory abs;
        

        sig.Ls = new alt_bn128.G1Point[](length);
        sig.Rs = new alt_bn128.G1Point[](length);

        for (uint i = 0; i < length; i++ ){
            
            (ghs.gL,ghs.gR) = halve(gs);
            (ghs.hL,ghs.hR) = halve(hs);
            (abs.aL,abs.aR) = halve(a);
            (abs.bL,abs.bR) = halve(b);

            sig.Ls[i] = LR(ghs.gR, ghs.hL, abs.aL, abs.bR, u);
            sig.Rs[i] = LR(ghs.gL, ghs.hR, abs.aR, abs.bL, u);
            

            uint256 c = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.Ls[i]),
                        alt_bn128.pack(sig.Rs[i])
                    )
                )
            )% alt_bn128.q;
            uint256 c_inv = alt_bn128.inv(c);
            gs = fold(ghs.gR, ghs.gL, c, c_inv);
            hs = fold(ghs.hL, ghs.hR, c, c_inv);
            a = fold(abs.aL, abs.aR, c, c_inv);
            b = fold(abs.bR, abs.bL, c, c_inv);

        }
        sig.a = a[0];
        sig.b = b[0];



    }


    function verify_(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        alt_bn128.G1Point memory u,
        Proof memory pi) public view returns (bool) 
    {
        
        alt_bn128.G1Point memory Pprime = pi.P.add(u.mul(pi.p));
        GHs memory ghs;
        // alt_bn128.G1Point[] memory gL;
        // alt_bn128.G1Point[] memory gR;
        // alt_bn128.G1Point[] memory hL;
        // alt_bn128.G1Point[] memory hR;
        for (uint i = 0; i < pi.Ls.length; i++){
            uint256 c = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(pi.Ls[i]),
                        alt_bn128.pack(pi.Rs[i])
                    )
                )
            )% alt_bn128.q;
            uint256 c_inv = alt_bn128.inv(c);
            uint256 c2 = alt_bn128.mul(c, c);
            uint256 cinv2 = alt_bn128.mul(c_inv , c_inv );

            Pprime = pi.Ls[i].mul(c2).add(Pprime).add(pi.Rs[i].mul(cinv2));
            (ghs.gL,ghs.gR) = halve(gs);
            (ghs.hL,ghs.hR) = halve(hs);

            gs = fold(ghs.gR, ghs.gL, c, c_inv);
            hs = fold(ghs.hL, ghs.hR, c, c_inv);

        }

        alt_bn128.G1Point memory ret = gs[0].mul(pi.a).add(hs[0].mul(pi.b)).add(u.mul( alt_bn128.mul(pi.a, pi.b)));

        return alt_bn128.eq(Pprime,ret);

    }






    function fold(
        alt_bn128.G1Point[] memory mul_c,
        alt_bn128.G1Point[] memory mul_inv,
        uint256 c,
        uint256 c_inv
    )private view returns (
            alt_bn128.G1Point[] memory gs
    )
    {   
        gs = new alt_bn128.G1Point[](mul_c.length);
        for (uint i = 0; i < mul_c.length; i++ ){
            gs[i] = mul_c[i].mul(c).add(mul_inv[i].mul(c_inv));
        }

    }

    function fold(
        uint256[] memory mul_c,
        uint256[] memory mul_inv,
        uint256 c,
        uint256 c_inv
    )private pure returns (
        uint256[] memory arr
    )
    {   
        arr = new  uint256[](mul_c.length);
        for (uint i = 0; i < mul_c.length; i++ ){
            arr[i] = alt_bn128.add(alt_bn128.mul(mul_c[i], c),alt_bn128.mul(mul_inv[i], c_inv));
        }

    }

    function LR(
        alt_bn128.G1Point[] memory gs,
        alt_bn128.G1Point[] memory hs,
        uint256[] memory a,
        uint256[] memory b,
        alt_bn128.G1Point memory u
    ) private view returns (
            alt_bn128.G1Point memory P
        )
    {
        // uint n = a.length;
        uint256 r = innerProd(a, b);

        P = mulAndSum(gs,a).add(mulAndSum(hs,b)).add(u.mul(r));
        
        
    }


    /// @dev halve Gs mut
    function halve(
        alt_bn128.G1Point[] memory Gs
    ) private pure returns (
        alt_bn128.G1Point[] memory Gs_1,
        alt_bn128.G1Point[] memory Gs_2
    ){
        uint n = Gs.length / 2;

        Gs_1 = new alt_bn128.G1Point[](n);
        Gs_2 = new alt_bn128.G1Point[](n);

        for (uint i = 0; i < n; i++) {
            Gs_1[i] = Gs[i];
            Gs_2[i] = Gs[n+i];
        }
    }


    /// @dev halve unit[]
    function halve(
        uint256[] memory a
    ) private pure returns (
        uint256[] memory a_1,
        uint256[] memory a_2
    ){
        uint n = a.length / 2;

        a_1 = new uint256[](n);
        a_2 = new uint256[](n);

        for (uint i = 0; i < n; i++) {
            a_1[i] = a[i];
            a_2[i] = a[n+i];
        }
    }

    function mulAndSum(
        alt_bn128.G1Point[] memory gs, 
        uint256[] memory cs
    ) public view returns (alt_bn128.G1Point memory c) {

        c = alt_bn128.G1Point(0, 0);

        for (uint i = 0; i < gs.length; i++) {
            c = c.add(gs[i].mul(cs[i]));
        }

    }

    function innerProd(
        uint256[] memory cs1,
        uint256[] memory cs2
    ) public pure returns (uint256 result) {

        
        result = 0;

        for (uint i = 0; i < cs1.length; i++) {
           result = alt_bn128.add(result, alt_bn128.mul(cs1[i],cs2[i]));
        }

    }


    function log2(uint x) private pure returns (uint n) {
        for (n = 0; x > 1; x >>= 1) n += 1;
    }






}