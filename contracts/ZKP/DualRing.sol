// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract DualRing {
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point; 
    using alt_bn128 for alt_bn128.G1Point[];

    struct Sig {
        uint256[] cs;
        uint256 z;
    }

    struct Param {
        alt_bn128.G1Point g;
        alt_bn128.G1Point[] pks;
    }

    // Function to generate a new private key
    function setup(uint256 ring_size, uint256[2] memory skj) public view returns (Param memory pp) {
        require(skj[1] < ring_size, "DualRing: secret key invalid position");
        pp.g = alt_bn128.random().uintToCurvePoint();
        pp.pks = new alt_bn128.G1Point[](ring_size);
        pp.pks[skj[1]] = pp.g.mul(skj[0]);
        for (uint i = 0; i < ring_size; i++) {
            if (i != skj[1]){
                uint256 k = alt_bn128.random();
                pp.pks[i] = pp.g.mul(k);
            }
        }
    }
    
    /** @dev dualring signature
     * @param pp public parameters
     * @param m message
     * @param skj [sk, index]
     * @return sig signature
     * @return c sum_i c_i := H(m, pks, R) 
     * @return R g^r * prod_{i != j} pk_i^{c_i} 
     */
    function sign(Param memory pp, string memory m, uint256[2] memory skj) 
    public view returns (Sig memory sig, uint256 c, alt_bn128.G1Point memory R) {
        require(skj[1] < pp.pks.length, "DualRing: secret key invalid index");
        uint256[] memory cs = new uint256[](pp.pks.length);
        uint256 r = alt_bn128.random();
        R = alt_bn128.mul(pp.g, r);
        uint256 sum_i = 0;
        for (uint256 i = 0; i < pp.pks.length; i++) {
            if (i != skj[1]) {
                cs[i] = alt_bn128.random();
                sum_i = sum_i.add(cs[i]);
                R = alt_bn128.add(R, alt_bn128.mul(pp.pks[i], cs[i]));
            }
        }
        // Hash
        c = H(m, pp.pks, R);
        uint256 c_j = c.sub(sum_i);
        cs[skj[1]] = c_j;
        
        uint256 z = r.add(alt_bn128.neg(skj[0].mul(c_j)));

        sig = Sig({
            cs : cs,
            z : z
        });
    }

    function verify(Param memory pp, string memory m, Sig memory sig) public view returns (bool) {
        alt_bn128.G1Point memory R = alt_bn128.mul(pp.g, sig.z);
        uint256 c = 0;

        for (uint256 i = 0; i < pp.pks.length; i++) {
            R = alt_bn128.add(R, alt_bn128.mul(pp.pks[i], sig.cs[i]));
            c = c.add(sig.cs[i]);
        }

        return c == H(m, pp.pks, R);
    }

    function H(string memory m, alt_bn128.G1Point[] memory pks, alt_bn128.G1Point memory R) internal pure 
    returns (uint256) {
        return uint256(keccak256(abi.encodePacked(m, pks.packArray(), R.X, R.Y))) % alt_bn128.q;
    }
}
