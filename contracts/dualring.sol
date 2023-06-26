// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./alt_bn128.sol";

contract DualRingEcc {
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point;

    struct Signature {
        uint256[] c;
        uint256 z;
        uint256 sum;
        alt_bn128.G1Point R;
        alt_bn128.G1Point[] Gs;
    }

    alt_bn128.G1Point g; // group generator

    alt_bn128.G1Point[] pks; //publicKeys for alt_bn128 point

    uint256[] public sks; // private keys

    // Function to generate a new private key
    function generateKeys(uint _ring_size) public {
        g = alt_bn128.uintToCurvePoint(1);

        for (uint i = 0; i < _ring_size; i++) {
            uint k = i + 1;
            sks.push(k);
            alt_bn128.G1Point memory pk = alt_bn128.mul(g, k);
            pks.push(pk);
        }
    }

    function packArray(
        alt_bn128.G1Point[] memory arr
    ) internal pure returns (bytes memory) {
        bytes memory packed;

        for (uint256 i = 0; i < arr.length; i++) {
            bytes memory temp = abi.encodePacked(arr[i].X, arr[i].Y);
            packed = abi.encodePacked(packed, temp);
        }

        return packed;
    }

    // Function to sign a message using a private key
    function basic_sign(
        string memory _message,
        uint _privateKeyIndex
    ) public view returns (Signature memory) {
        require(
            _privateKeyIndex < sks.length,
            "DualRing: Invalid private key index"
        );

        uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp))) %
            (alt_bn128.q);

        alt_bn128.G1Point memory R = alt_bn128.mul(g, r);

        uint256[] memory cArray = new uint256[](sks.length);

        uint256 sumExceptJ = 0;

        for (uint256 i = 0; i < sks.length; i++) {
            if (i != _privateKeyIndex) {
                cArray[i] =
                    (uint256(keccak256(abi.encodePacked(block.timestamp, i))) >>
                        10) %
                    (alt_bn128.q);
                sumExceptJ = sumExceptJ + cArray[i];
                alt_bn128.G1Point memory temp = alt_bn128.mul(
                    pks[i],
                    cArray[i]
                );
                R = alt_bn128.add(R, temp);
            }
        }

        bytes32 messageHash = keccak256(bytes(_message));

        uint256 c = (uint256(
            bytes32(
                keccak256(
                    abi.encodePacked(messageHash, packArray(pks), R.X, R.Y)
                )
            )
        ) >> 4) % (alt_bn128.q);

        cArray[_privateKeyIndex] = alt_bn128.add(c, alt_bn128.neg(sumExceptJ));

        uint256 p = mulmod(
            sks[_privateKeyIndex],
            cArray[_privateKeyIndex],
            alt_bn128.q
        );

        uint256 z = alt_bn128.add(r, alt_bn128.neg(p));

        Signature memory sig = Signature({
            c: cArray,
            z: z,
            sum: c,
            R: R,
            Gs: pks
        });

        return sig;
    }

    // verify a message with the given signature
    function basic_verify(
        string memory _message,
        Signature memory sig
    ) public view returns (bool) {
        uint256 sumExceptJ = 0;

        uint256[] memory cArray = sig.c;

        uint256 z = sig.z;

        alt_bn128.G1Point memory R = alt_bn128.mul(g, z);

        for (uint256 i = 0; i < sig.Gs.length; i++) {
            sumExceptJ = addmod(sumExceptJ, cArray[i], alt_bn128.q);
            alt_bn128.G1Point memory tempV = alt_bn128.mul(
                sig.Gs[i],
                cArray[i]
            );
            R = alt_bn128.add(tempV, R);
        }
        bytes32 messageHash = keccak256(bytes(_message));

        uint256 c = (uint256(
            bytes32(
                keccak256(
                    abi.encodePacked(messageHash, packArray(pks), R.X, R.Y)
                )
            )
        ) >> 4) % (alt_bn128.q);

        return c == sumExceptJ;
    }
}
