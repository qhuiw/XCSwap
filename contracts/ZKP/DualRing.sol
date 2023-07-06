// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";

contract DualRing {
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point;

    struct Signature {
        uint256[] c;
        uint256 z;
        uint256 sum;
        alt_bn128.G1Point R;
        alt_bn128.G1Point[] Gs;
    }

    struct Param {
        alt_bn128.G1Point g;
        alt_bn128.G1Point[] pks;
    }

    // Function to generate a new private key
    function setup(uint256 ring_size, uint256[2] memory skj) public view returns (Param memory pp) {
        require(skj[1] < ring_size, "secret key invalid position");
        pp.g = alt_bn128.uintToCurvePoint(1);
        pp.pks = new alt_bn128.G1Point[](ring_size);
        pp.pks[skj[1]] = pp.g.mul(skj[0]);
        for (uint i = 0; i < ring_size; i++) {
            if (i != skj[1]){
                uint k = i + 1;
                pp.pks[i] = pp.g.mul(k);
            }
        }
    }

    function packArray(alt_bn128.G1Point[] memory a) private pure returns (bytes memory packed) {
        packed = a[0].pack();

        for (uint256 i = 1; i < a.length; i++) {
            // bytes memory temp = abi.encodePacked(a[i].X, a[i].Y);
            packed = abi.encodePacked(packed, a[i].pack());
        }
    }

    
    function sign(Param memory pp, string memory m, uint256[2] memory skj) 
    public view returns (Signature memory sig) {
        require(skj[1] < pp.pks.length, "DualRing: Invalid private key index");

        uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp))) % alt_bn128.q;

        alt_bn128.G1Point memory R = alt_bn128.mul(pp.g, r);

        uint256[] memory cs = new uint256[](pp.pks.length);

        uint256 sumExceptJ = 0;

        for (uint256 i = 0; i < pp.pks.length; i++) {
            if (i != skj[1]) {
                cs[i] = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) >> 10) % alt_bn128.q;
                sumExceptJ = sumExceptJ.add(cs[i]);
                R = alt_bn128.add(R, alt_bn128.mul(pp.pks[i],cs[i]));
            }
        }

        bytes32 messageHash = keccak256(bytes(m));

        uint256 c = (uint256(
            bytes32(
                keccak256(
                    abi.encodePacked(messageHash, packArray(pp.pks), R.X, R.Y)
                )
            )
        ) >> 4) % (alt_bn128.q);

        uint256 c_j = alt_bn128.add(c, alt_bn128.neg(sumExceptJ));

        uint256 p = skj[0].mul(c_j);
        // mulmod(
        //     sk_j,
        //     c_j,
        //     alt_bn128.q
        // );

        uint256 z = alt_bn128.add(r, alt_bn128.neg(p));

        sig = Signature({
            c : cs,
            z : z,
            sum : c,
            R : R,
            Gs : pp.pks
        });
    }

    function verify(Param memory pp, string memory m, Signature memory sig) public view returns (bool) {
        uint256 sumExceptJ = 0;

        uint256[] memory cs = sig.c;

        uint256 z = sig.z;

        alt_bn128.G1Point memory R = alt_bn128.mul(pp.g, z);

        for (uint256 i = 0; i < sig.Gs.length; i++) {
            sumExceptJ = addmod(sumExceptJ, cs[i], alt_bn128.q);
            R = alt_bn128.add(R, alt_bn128.mul(sig.Gs[i], cs[i]));
        }
        bytes32 messageHash = keccak256(bytes(m));

        uint256 c = (uint256(
            bytes32(
                keccak256(
                    abi.encodePacked(messageHash, packArray(pp.pks), R.X, R.Y)
                )
            )
        ) >> 4) % (alt_bn128.q);

        return c == sumExceptJ;
    }
}
