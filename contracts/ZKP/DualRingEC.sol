// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// import "../lib/alt_bn128.sol";
import "./DualRing.sol";
import "./NISA.sol";

contract DualRingEC is DualRing {
    using alt_bn128 for uint256;
	using alt_bn128 for alt_bn128.G1Point;
    using alt_bn128 for alt_bn128.G1Point[];

    NISA private nisa;
    
    // struct Response{
    //     uint256[] c;
    //     uint256 z;
    //     uint256 sum;
    //     alt_bn128.G1Point R;
    // }

    struct ParamEC {
        DualRing.Param dr_pp;
        // alt_bn128.G1Point g;
        // alt_bn128.G1Point[] pks;
        alt_bn128.G1Point u;
    }

    struct SigEC{
        uint256 z;
        alt_bn128.G1Point R;
        NISA.Sig nisa_sig;
        // NISA.Param nisa_pp;
    }

    constructor (address nisa_addr) {
        nisa = NISA(nisa_addr);
    }

    // alt_bn128.G1Point g;
    // uint256[] public sks; // private keys
    // alt_bn128.G1Point[] pks; // over EC

    // // Function to generate a new private key
    // function generateKeys(uint _ring_size) public {

    //     // uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp)));
	// 	g = alt_bn128.uintToCurvePoint(1);
    //     for (uint i = 0; i < _ring_size; i++) {
    //         uint k = i+1; 
    //         sks.push(k);

    //         alt_bn128.G1Point memory pk = alt_bn128.mul(g,k);
    //         pks.push(pk);
    //     }
        
    // }

    // function packArray(alt_bn128.G1Point[] memory arr) internal pure returns (bytes memory) {
    //     bytes memory packed;
    //     for (uint256 i = 0; i < arr.length; i++) {
    //         bytes memory temp = abi.encodePacked(arr[i].X, arr[i].Y);
    //         packed = abi.encodePacked(packed, temp);
    //     }
    //     return packed;
    // }



    // Function to sign a message using a private key
    // function basic_sign(string memory m, uint skj) public view returns (Response memory) {
    //     require(skj < sks.length, "DualRing: Invalid private key index");


    //     uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp))); // random number, for testing purpose set it fixed

    //     // emit LogVariable(r);
        
    //     // commitment point R 
    //     alt_bn128.G1Point memory R = g.mul(r); 
       
    //     uint256[] memory cArray = new uint256[](pks.length);


    //     uint256 sumExceptJ = 0;
    //     for (uint256 i = 0 ; i < pks.length ; i ++){
    //         if (i!=  skj ){

    //             cArray[i] = (uint256(keccak256(abi.encodePacked(block.timestamp,i)))>>10)% alt_bn128.q;
    //             sumExceptJ = sumExceptJ +  cArray[i];

    //             alt_bn128.G1Point memory temp = pks[i].mul(cArray[i]);
    //             R = R.add(temp);
    //         }
    //     }


    //     bytes32 messageHash = keccak256(bytes(m));
    //     uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));

    //     cArray[skj] = alt_bn128.add(c, alt_bn128.neg(sumExceptJ ));

    //     uint256 p = mulmod(sks[skj] , cArray[skj],alt_bn128.q);

    //     uint256 z = alt_bn128.add(r, alt_bn128.neg(p));

    //     Response memory sig = Response({
    //         c: cArray,
    //         z: z, 
    //         sum: c,
    //         R: R 
    //     });

    //     return sig;
    // }


    // // verify a message with the given signature
    // function basic_verify(string memory m, Response memory sig) public view returns (bool) {

    //     uint256 sumExceptJ = 0;
        
    //     uint256[] memory cArray = sig.c;
    //     uint256 z = sig.z;

    //     alt_bn128.G1Point memory R = alt_bn128.mul(g,z);

    //     for (uint256 i = 0; i < pks.length ; i++){
    //         sumExceptJ = addmod(sumExceptJ,cArray[i],alt_bn128.q);

    //         alt_bn128.G1Point memory tempV = alt_bn128.mul(pks[i], cArray[i]);

    //         R = alt_bn128.add(tempV,R);
    //     }


    //     bytes32 messageHash =  keccak256(bytes(m));
    //     uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));


    //     return c == sumExceptJ;
    // }



    function setupEC(uint256 ring_size, uint256[2] memory skj) public view returns (ParamEC memory pp){
        pp.dr_pp = DualRing.setup(ring_size, skj);
        pp.u = alt_bn128.random().uintToCurvePoint();
        // pp = ParamEC({
        //     g : p.g,
        //     pks : p.pks,
        //     u : alt_bn128.random().uintToCurvePoint()
        // });
    }
    
    function signEC(ParamEC memory pp, string memory m, uint[2] memory skj) public view returns (SigEC memory sig) {
        DualRing.Sig memory dr_sig; 
        uint256 c;
        alt_bn128.G1Point memory R; 
        (dr_sig, c, R) = DualRing.sign(pp.dr_pp, m, skj);

        NISA.Param memory nisa_pp = NISA.Param({
            Gs : pp.dr_pp.pks,
            P : R.add(pp.dr_pp.g.mul(dr_sig.z).neg()),
            u : pp.u,
            c : c  
        });

        /// @dev reduce signature size
        NISA.Sig memory nisa_sig = nisa.prove(nisa_pp, dr_sig.cs); 

        sig = SigEC({
            z : dr_sig.z,
            R : R,
            nisa_sig : nisa_sig
            // nisa_pp : nisa_pp
        });
    }

    function verifyEC(ParamEC memory pp, string memory m, SigEC memory sig) public view returns (bool) {

        uint256 c = H(m, pp.dr_pp.pks, sig.R);
        // uint256(keccak256(abi.encodePacked(m, pp.dr_pp.pks.packArray(), sig.R.X, sig.R.Y))) % alt_bn128.q;

        alt_bn128.G1Point memory P = sig.R.add(pp.dr_pp.g.mul(sig.z).neg());

        NISA.Param memory nisa_pp = NISA.Param({
            Gs : pp.dr_pp.pks,
            P : P,
            u : pp.u,
            c : c
        });

        require(nisa.verify(nisa_pp, sig.nisa_sig), "DualRingEC failed");

        return true;
    }

    // function from_external_verify(string memory m, Args memory sig) public view returns (bool) {
    //     NISA.Param memory pp = NISA.Param({
    //         Gs : sig.Gs,
    //         P : sig.P,
    //         u : g,
    //         c: sig.c
    //     });
    //     NISA.Sig memory nisa_sig = NISA.Sig({
    //         Ls: sig.Ls,
    //         Rs: sig.Rs,
    //         a: sig.a,
    //         b: sig.b  
    //     });

    //     assert(nisa.verify(pp, nisa_sig));

    //     alt_bn128.G1Point memory R =  alt_bn128.add(alt_bn128.mul(g,sig.z),sig.P);

    //     // alt_bn128.G1Point memory R = response.s.R;
    //     bytes32 messageHash =  keccak256(bytes(m));
    //     uint256 c = (uint256(bytes32(keccak256(abi.encodePacked(messageHash, packArray(pks),R.X, R.Y)))));

    //     return c== sig.c;
                
    // }
}

    // struct Args {
    //     uint256 z;
	// 	alt_bn128.G1Point[] Gs; 
	// 	alt_bn128.G1Point P; 
	// 	uint256 c;
	// 	alt_bn128.G1Point[] Ls;
	// 	alt_bn128.G1Point[] Rs;
	// 	uint256 a;
	// 	uint256 b;
    // }
    

    // function get_para(SigEC memory sig) public pure returns (Args memory args){
    //     args = Args({
    //         z: sig.z,
    //         Gs: sig.pp.Gs,
    //         P: sig.pp.P,
    //         c: sig.pp.c,
    //         Ls: sig.nisa_sig.Ls,
    //         Rs: sig.nisa_sig.Rs,
    //         a: sig.nisa_sig.a,
    //         b: sig.nisa_sig.b
    //     });
    // }