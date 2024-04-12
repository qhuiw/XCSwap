// SPDX-License-Identifier: GPL-3.0
/// developed by Xiangyu Hui
pragma solidity >=0.4.0 <0.9.0;

import "../lib/alt_bn128.sol";
import "./BulletProofs.sol";

contract RangeProof is BulletProofs{
    using alt_bn128 for uint256;
    using alt_bn128 for alt_bn128.G1Point;
    
    struct Sig {
        alt_bn128.G1Point V;
        alt_bn128.G1Point A;
        alt_bn128.G1Point S;
        alt_bn128.G1Point T_1;
        alt_bn128.G1Point T_2;
        alt_bn128.G1Point W;
        uint256 t_hat;
        uint256 tau_x;
        uint256 rW;
        Proof pi;
    }

    struct Vecs {
        uint256[] zs;
        uint256[] z2s;
        uint256[] ys;
        uint256[] y_c_z;
        uint256[] y_s2;
        uint256[] v;
        uint256[] twos;
        uint256[] cs;
        uint256[] cs_p;
        uint256[] s_1s ;
        uint256[] s_2s ;
        uint256[] ls;
        uint256[] rs;
        uint256[] es1;
        uint256[] es2;
    }

    struct Zr {
        uint256 r_A;
        uint256 r_S;
        uint256 x;
        uint256 y;
        uint256 z;
        uint256 t_1;
        uint256 t_2;
        uint256 tau_1;
        uint256 tau_2;
        uint256 delta;
        uint256 c;
        uint256 c_inv;
        uint256 c2;
        uint256 cinv2; 
        uint256 sum1 ;
        uint256 sum2 ;
    }


    
    function sign(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        alt_bn128.G1Point memory F,
        alt_bn128.G1Point memory K,
        alt_bn128.G1Point memory Q,
        uint value,
        uint256 gamma,
        uint size
    ) public view returns (Sig memory sig) {
        require(gs.length == size && hs.length == size, "unequal length");
        sig.V = F.mul(value).add(Q.mul(gamma));

        Vecs memory vs;
        Zr memory zr;

        (vs.cs, vs.cs_p) = bitDecom(value, size); // fixme 

        vs.s_1s = new uint256[](size);
        vs.s_2s = new uint256[](size);

        for(uint i = 0 ; i< size ; i++){
            vs.s_1s[i] = alt_bn128.random();
            vs.s_2s[i] = alt_bn128.random();
        }

        zr.r_A = alt_bn128.random();
        zr.r_S = alt_bn128.random();

        sig.A = Q.mul(zr.r_A).add(mulAndSum(gs,vs.cs)).add(mulAndSum(hs,vs.cs_p));
        sig.S = Q.mul(zr.r_S).add(mulAndSum(gs,vs.s_1s)).add(mulAndSum(hs,vs.s_2s));

       zr.z = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.A ),
                        alt_bn128.pack(sig.S)
                    )
                )
        )% alt_bn128.q;

        zr.y = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.A ),
                        alt_bn128.pack(sig.S),
                        zr.z
                    )
                )
        )% alt_bn128.q;

        

        vs.zs = new uint256[](size);
        vs.z2s= new uint256[](size);
        vs.ys= new uint256[](size);
        vs.y_c_z= new uint256[](size);
        vs.y_s2= new uint256[](size);

        for(uint i = 0 ; i < size; i++){
            vs.zs[i] = zr.z;
            vs.z2s[i] = 
                zr.z.modExp(2).mul(alt_bn128.modExp(2,i)) ;
            vs.ys[i] = zr.y.modExp(i);
            vs.y_c_z[i] = vs.ys[i].mul(vs.cs_p[i].add(zr.z));
            vs.y_s2[i] = vs.ys[i].mul(vs.s_2s[i]);
        }

        zr.t_1 =  innerProd(vs.y_c_z, vs.s_1s).
            add(innerProd(vs.z2s, vs.s_1s)).
            add(innerProd(vs.cs, vs.y_s2)).
            sub(innerProd(vs.zs, vs.y_s2));
        
        zr.t_2 = innerProd(vs.s_1s, vs.y_s2);

        zr.tau_1 = alt_bn128.random();
        zr.tau_2 = alt_bn128.random();

        sig.T_1 = F.mul(zr.t_1).add(Q.mul(zr.tau_1));
        sig.T_2 = F.mul(zr.t_2).add(Q.mul(zr.tau_2));

        zr.x = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.T_1 ),
                        alt_bn128.pack(sig.T_2 )
                    )
                )
        )% alt_bn128.q;

        vs.ls = new uint256[](size);
        vs.rs = new uint256[](size);

        for(uint i  = 0 ; i < size ; i++){
            vs.ls[i] =  vs.cs[i].sub(zr.z).add(vs.s_1s[i].mul(zr.x));

            vs.rs[i] =  vs.ys[i].mul(vs.cs_p[i].add(zr.z).add(vs.s_2s[i].mul(zr.x))).add(vs.z2s[i]);
        }

        sig.t_hat = innerProd(vs.ls, vs.rs);

        sig.tau_x = zr.tau_2.mul(zr.x.modExp(2)).add(zr.tau_1.mul(zr.x)).add(zr.z.modExp(2).mul(gamma));

        sig.rW = zr.r_A.add(zr.r_S.mul(zr.x));


        for(uint i = 0 ;  i < size ; i++){ 
            hs[i] = hs[i].mul(alt_bn128.inv(alt_bn128.modExp(zr.y,i)));
        }

        sig.pi = prove(gs, hs, K, vs.ls, vs.rs);

        sig.W  = mulAndSum(gs,vs.ls).add(mulAndSum(hs,vs.rs));

    

    }

    


    


    function verify(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        alt_bn128.G1Point memory F,
        alt_bn128.G1Point memory K,
        alt_bn128.G1Point memory Q,
        uint size,
        Sig memory sig
    ) public view returns (bool) {
       
        Zr memory zr;
        

        Vecs memory vs;
        

        
        subVerifirst(zr,vs,size, sig);

        if( !subVeriSecond(zr, F, Q, sig)){
            return false;
        }
        
        return subVeriFifth(subVeriThird(gs, hs, zr, vs, size, sig), subVeriFourth(sig.W, K, sig.t_hat, sig.pi), K,Q, zr.x, sig);





    }


    function subVerifirst(
        Zr memory zr,
        Vecs memory vs,
        uint size, 
        Sig memory sig
    ) private view {
        zr.z = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.A ),
                        alt_bn128.pack(sig.S)
                    )
                )
        )% alt_bn128.q;

        zr.y = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.A ),
                        alt_bn128.pack(sig.S),
                        zr.z
                    )
                )
        )% alt_bn128.q;

        zr.x = uint256(
                keccak256(
                    abi.encodePacked(
                        alt_bn128.pack(sig.T_1  ),
                        alt_bn128.pack(sig.T_2 )
                    )
                )
        )% alt_bn128.q;
        vs.zs = new uint256[](size);
        vs.z2s= new uint256[](size);
        vs.ys= new uint256[](size);
        vs.twos= new uint256[](size);
        vs.v= new uint256[](size);
        

        for(uint i = 0 ; i < size; i++){
            vs.zs[i] = zr.z;
            vs.z2s[i] = 
                zr.z.modExp(2).mul(alt_bn128.modExp(2,i)) ;
            vs.ys[i] = zr.y.modExp(i);
            vs.twos[i] = alt_bn128.modExp(2,i);
            vs.v[i] =  zr.z.mul(zr.y.modExp(i)).add(zr.z.modExp(2).mul(vs.twos[i]));
            
        }

        zr.delta = 
            (zr.z.sub(zr.z.modExp(2)).mul(sum(vs.ys))).sub(zr.z.modExp(3).mul(sum(vs.twos)));

        

    }

    function subVeriSecond(
        Zr memory zr,
        alt_bn128.G1Point memory F,
        alt_bn128.G1Point memory Q,
        Sig memory sig
    ) private view returns (bool){
        return alt_bn128.eq(F.mul(sig.t_hat).add(Q.mul(sig.tau_x)),
            sig.V.mul(alt_bn128.modExp(zr.z,2)).add(F.mul(zr.delta)).add(sig.T_1.mul(zr.x)).add(sig.T_2.mul(alt_bn128.modExp(zr.x,2))));
    }

    function subVeriThird(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        Zr memory zr,
        Vecs memory vs,
        uint size, 
        Sig memory sig
    ) private view returns (alt_bn128.G1Point memory p){
        
       
        vs.es1 = new uint256[](size);
        vs.es2 = new uint256[](size);
        for(uint i = 0; i < size; i++){
            zr.sum1 =1;
            zr.sum2 =1;
            
            for( uint j = 0 ; j< sig.pi.Ls.length ; j++){
                zr.c = uint256(
                    keccak256(
                        abi.encodePacked(
                            alt_bn128.pack(sig.pi.Ls[sig.pi.Ls.length-j-1]), 
                            alt_bn128.pack(sig.pi.Rs[sig.pi.Rs.length-j-1])
                        )
                    )
                )% alt_bn128.q;
                zr.c_inv = alt_bn128.inv(zr.c);
                zr.sum1 = zr.sum1.mul(check_bit(i,j,zr.c_inv));
                zr.sum2 = zr.sum2.mul(check_bit(i,j,zr.c));
            }
            vs.es1[i] = zr.sum1.mul(sig.pi.a).sub(zr.z);
            vs.es2[i] = zr.sum2.mul(sig.pi.b).mul(alt_bn128.inv(vs.ys[i])).add(zr.z.modExp(2).mul(vs.twos[i]).mul(alt_bn128.inv(vs.ys[i]))).add(zr.z);
        }
        p = mulAndSum(gs,vs.es1).add(mulAndSum(hs,vs.es2));

    }

    function subVeriFourth(
            alt_bn128.G1Point memory W,
            alt_bn128.G1Point memory K,
            uint256 t_hat,
            Proof memory pi
        ) private view returns (alt_bn128.G1Point memory p) {
            p = W.add(K.mul(t_hat));
            for (uint i = 0; i < pi.Ls.length; i++) {
                uint256 c = uint256(
                    keccak256(
                        abi.encodePacked(
                            alt_bn128.pack(pi.Ls[i]),
                            alt_bn128.pack(pi.Rs[i])
                        )
                    )
                ) % alt_bn128.q;
                uint256 c_inv = alt_bn128.inv(c);
                uint256 c2 = alt_bn128.mul(c, c);
                uint256 cinv2 = alt_bn128.mul(c_inv, c_inv);
                p = pi.Ls[i].mul(c2).add(p).add(pi.Rs[i].mul(cinv2));
            }
            
        }


    function subVeriFifth(
            alt_bn128.G1Point memory p1,
            alt_bn128.G1Point memory p2,
            alt_bn128.G1Point memory K,
            alt_bn128.G1Point memory Q,
            uint256 x,
            Sig memory sig
        ) private view returns (bool) {
            return alt_bn128.eq( p2.add(sig.W.add(Q.mul(sig.rW))), 
        p1.add(K.mul(sig.pi.a.mul(sig.pi.b))).add(sig.A).add(sig.S.mul(x)));
    }



    function check_bit(
        uint i, uint j , uint256 a
    ) private view returns (
        uint256 b) {
            b = ((i>>j) &1) == 1 ? alt_bn128.inv(a) : a ;

    }

    function test1(
        alt_bn128.G1Point[] memory gs, 
        alt_bn128.G1Point[] memory hs, 
        alt_bn128.G1Point memory K,
        uint size
    ) public view returns (
        bool) {
         
        Vecs memory vs;
        vs.ls = new uint256[](size);
        vs.rs = new uint256[](size);
        for(uint i = 0 ; i< size ; i++){
            vs.ls[i] = i+1;
            vs.rs[i] = i+2;
        }
        prove(gs, hs, K, vs.ls, vs.rs);
        return true;
        
        
    }

    function bitDecom(
        uint v, uint size
    ) private pure returns (
        uint256[] memory cs,
        uint256[] memory cs_p) {

        cs = new uint256[](size);
        cs_p = new uint256[](size);
        
        for(uint i = 0 ; i< size ; i++){
            cs[i] = ( v >> i) & 1;
            cs_p[i] = alt_bn128.sub(cs[i], 1);
            
        }
        
    }




    function sum(
        uint256[] memory cs
    ) public pure returns (uint256 result) {
        result = 0;

    for (uint i = 0; i < cs.length; i++) {
           result = alt_bn128.add(result, cs[i]);
        }

    }



}