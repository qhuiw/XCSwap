// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "./NISA.sol";

contract DualRingEC {

    using alt_bn128 for uint256;
	using alt_bn128 for alt_bn128.G1Point;

    NISA public nisa;
    
    struct Response{
        uint256[] c;
        uint256 z;
        uint256 sum;
        alt_bn128.G1Point R;
    }

    struct Signature{
        uint256 z;
        NISA.Sig pi;
        NISA.Param pp;
    }

    alt_bn128.G1Point g;
    uint256[] public sks; // private keys
    alt_bn128.G1Point[] pks; // over EC

    // Function to generate a new private key
    function generateKeys(uint _ring_size) public {

        // uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp)));
		g = alt_bn128.uintToCurvePoint(1);
        for (uint i = 0; i < _ring_size; i++) {
            uint k = i+1; 
            sks.push(k);

            alt_bn128.G1Point memory pk = alt_bn128.mul(g,k);
            pks.push(pk);
        }
        
    }

    function packArray(alt_bn128.G1Point[] memory arr) internal pure returns (bytes memory) {
        bytes memory packed;
        for (uint256 i = 0; i < arr.length; i++) {
            bytes memory temp = abi.encodePacked(arr[i].X, arr[i].Y);
            packed = abi.encodePacked(packed, temp);
        }
        return packed;
    }



    // Function to sign a message using a private key
    function basic_sign(string memory _message, uint _privateKeyIndex) public view returns (Response memory) {
        require(_privateKeyIndex < sks.length, "DualRing: Invalid private key index");


        uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp))); // random number, for testing purpose set it fixed

        // emit LogVariable(r);
        
        // commitment point R 
        alt_bn128.G1Point memory R = g.mul(r); 
       
        uint256[] memory cArray = new uint256[](pks.length);


        uint256 sumExceptJ = 0;
        for (uint256 i = 0 ; i < pks.length ; i ++){
            if (i!=  _privateKeyIndex ){

                cArray[i] = (uint256(keccak256(abi.encodePacked(block.timestamp,i)))>>10)% alt_bn128.q;
                sumExceptJ = sumExceptJ +  cArray[i];

                alt_bn128.G1Point memory temp = pks[i].mul(cArray[i]);
                R = R.add(temp);
            }
        }


        bytes32 messageHash = keccak256(bytes(_message));
        uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));

        cArray[_privateKeyIndex] = alt_bn128.add(c, alt_bn128.neg(sumExceptJ ));

        uint256 p = mulmod(sks[_privateKeyIndex] , cArray[_privateKeyIndex],alt_bn128.q);

        uint256 z = alt_bn128.add(r, alt_bn128.neg(p));

        Response memory sig = Response({
            c: cArray,
            z: z, 
            sum: c,
            R: R 
        });

        return sig;
    }


    // verify a message with the given signature
    function basic_verify(string memory _message, Response memory sig) public view returns (bool) {

        uint256 sumExceptJ = 0;
        
        uint256[] memory cArray = sig.c;
        uint256 z = sig.z;

        alt_bn128.G1Point memory R = alt_bn128.mul(g,z);

        for (uint256 i = 0; i < pks.length ; i++){
            sumExceptJ = addmod(sumExceptJ,cArray[i],alt_bn128.q);

            alt_bn128.G1Point memory tempV = alt_bn128.mul(pks[i], cArray[i]);

            R = alt_bn128.add(tempV,R);
        }


        bytes32 messageHash =  keccak256(bytes(_message));
        uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));


        return c == sumExceptJ;
    }


    // sign a message with bulletproof
    function full_sign(string memory _message, uint _privateKeyIndex)  public view returns (Signature memory ) {
        Response memory re = basic_sign(_message, _privateKeyIndex);
        alt_bn128.G1Point memory temp =  alt_bn128.neg(alt_bn128.mul(g,re.z));

        NISA.Param memory param = NISA.Param({
            Gs : pks,
            P : alt_bn128.add(temp,re.R),
            u : g,
            c : re.sum  
        });

        NISA.Sig memory p = nisa.prove(param, re.c); // reduce signature size

        Signature memory sig = Signature({
            z : re.z,
            pi : p,
            pp : param
        });

        return sig;
    }

    struct Args {
        uint256 z;
		alt_bn128.G1Point[] Gs; 
		alt_bn128.G1Point P; 
		uint256 c;
		alt_bn128.G1Point[] Ls;
		alt_bn128.G1Point[] Rs;
		uint256 a;
		uint256 b;
    }
    

    function get_para(Signature memory sig) public pure returns (Args memory args){
        args = Args({
            z: sig.z,
            Gs: sig.pp.Gs,
            P: sig.pp.P,
            c: sig.pp.c,
            Ls: sig.pi.Ls,
            Rs: sig.pi.Rs,
            a: sig.pi.a,
            b: sig.pi.b
        });
    }


    // verify the message and proof generated from the full_sign funnction
    function full_verify(string memory _message, Signature memory sig )  public view returns (bool) {
        require (nisa.verify(sig.pp, sig.pi));

        if (! nisa.verify(sig.pp, sig.pi)){
            return false;
        }

        alt_bn128.G1Point memory R =  alt_bn128.add(alt_bn128.mul(g,sig.z),sig.pp.P);

        // alt_bn128.G1Point memory R = response.s.R;
        bytes32 messageHash =  keccak256(bytes(_message));
        uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));

        return c== sig.pp.c;

    }


    function from_external_verify(string memory _message, Args memory sig)  public view returns (bool) {
        NISA.Param memory pp = NISA.Param({
            Gs : sig.Gs,
            P : sig.P,
            u : g,
            c: sig.c
        });
        NISA.Sig memory pi = NISA.Sig({
            Ls: sig.Ls,
            Rs: sig.Rs,
            a: sig.a,
            b: sig.b  
        });

        assert(nisa.verify(pp, pi));

        alt_bn128.G1Point memory R =  alt_bn128.add(alt_bn128.mul(g,sig.z),sig.P);

        // alt_bn128.G1Point memory R = response.s.R;
        bytes32 messageHash =  keccak256(bytes(_message));
        uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));

        return c== sig.c;
                
    }
}