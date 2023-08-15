// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

/**
 * @dev arithmetic operations over elliptic curve alt_bn128
 */
library alt_bn128 {

    /// @dev curve order (prime)
    uint256 public constant q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    /// @dev field order (prime)
    uint256 public constant n = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    uint256 public constant b = 3;

    // uint256 constant public ECSignMask = 0x8000000000000000000000000000000000000000000000000000000000000000;
    // uint256 constant public BigModExponent = (n + 1)/4;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    /// @dev addition of 2 EC points
    /// @param p1 a EC point
    /// @param p2 a EC point
    /// @return r sum of p1+p2
    function add(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        assembly {
            if iszero(staticcall(not(0), 0x06, input, 0x80, r, 0x40)) {
                revert(0, 0)
            }
        }
    }

    /// @dev scalar multiply an EC point
    /// @param p EC point
    /// @param s the scalar
    /// @return r multipled EC point
    function mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        if (s == 1) {
            return p;
        }
        if (s == 2) {
            return add(p, p);
        }
        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        assembly {
            if iszero(staticcall(not(0), 0x07, input, 0x60, r, 0x40)) {
                revert(0, 0)
            }
        }
    }

    function neg(G1Point memory p) internal pure returns (G1Point memory) {
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, n - p.Y);
        // return G1Point(p.X, n - (p.Y % n));
    }

    function eq(G1Point memory p1, G1Point memory p2) internal pure returns (bool) {
        return p1.X == p2.X && p1.Y == p2.Y;
    }

    function add(uint256 x, uint256 y) internal pure returns (uint256) {
        return addmod(x, y, q);
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256) {
        return mulmod(x, y, q);
    }

    function inv(uint256 x) internal view returns (uint256) {
        return modExp(x, q - 2, q);
    }

    function mod(uint256 x) internal pure returns (uint256) {
        return x % q;
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256) {
        return x >= y ? x - y : q - y + x;
    }

    function neg(uint256 x) internal pure returns (uint256) {
        return q - x;
    }

    function modExp(uint256 base, uint256 exponent, uint256 modulus) internal view returns (uint256) {
        uint256[6] memory input;
        uint256[1] memory output;
        input[0] = 0x20;  // length_of_BASE
        input[1] = 0x20;  // length_of_EXPONENT
        input[2] = 0x20;  // length_of_MODULUS
        input[3] = base;
        input[4] = exponent;
        input[5] = modulus;
        assembly {
            if iszero(staticcall(not(0), 0x05, input, 0xc0, output, 0x20)) {
                revert(0, 0)
            }
        }
        return output[0];
    }

    function modExp(uint256 base, uint256 exponent) internal view returns (uint256) {
        return modExp(base, exponent, q);
    }

    function uintToCurvePoint(uint256 x) internal view returns(G1Point memory p) {
        uint256 seed = x % n;
        uint256 y;
        seed -= 1;
        bool onCurve = false;
        uint256 y2;
        while(!onCurve) {
            seed += 1;
            y2 = mulmod(seed, seed, n);
            y2 = mulmod(y2, seed, n);
            y2 = addmod(y2, b, n);
            // y2 += b;
            y = modExp(y2, (n + 1) / 4, n);
            onCurve = mulmod(y, y, n) == y2;
        }
        return G1Point(seed, y);
    }

    /** @dev pack and encode a G1Point */
    function pack(G1Point memory p) public pure returns (bytes memory){
      return abi.encodePacked(p.X, p.Y);
    }

    function packArray(alt_bn128.G1Point[] memory a) public pure returns (bytes memory packed) {
        packed = pack(a[0]);
        for (uint256 i = 1; i < a.length; i++) {
            packed = abi.encodePacked(packed, pack(a[i]));
        }
    }

    function random() public view returns(uint256){
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % q;
    }
    
    function random(uint i) public view returns(uint256){
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % q;
    }

    // function random() internal view returns (uint256) {
    //     return uint256(keccak256(abi.encodePacked(
    //     tx.origin,
    //     blockhash(block.number - 1),
    //     block.timestamp
    //     )));
    // }
}