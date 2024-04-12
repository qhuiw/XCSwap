const alt_bn128 = artifacts.require("alt_bn128");
const RangeProof = artifacts.require("RangeProof");
const PubParam = artifacts.require("PubParam");
const assert = require("assert");

contract("RangeProof", async () => {
  var pp, rp,lib;
  const n_ty = 1;
  const x = [1,2,3,4,5,6,7,3];
  const y = [1,2,3,4,0,0,0,5];

  before (async () => {
  lib = await alt_bn128.deployed();
  await PubParam.link(lib);
  await RangeProof.link(lib);
  pp = await PubParam.new(n_ty);
  rp = await RangeProof.new();
  })

 it ("tests rp", async () => {
  
  const Gs = await pp.Gs();
  const Hs = await pp.Hs();
  const F = await pp.F();
  const Q = await pp.Q();
  const K = await pp.K();
  

  const sig = await rp.sign(Gs, Hs, F, K, Q, 7, 3, 8);
  const b = await rp.verify(Gs, Hs, F, K, Q, 8, sig);
  assert (b == true, "bp failed");
  
  const gas = await rp.verify.estimateGas(Gs, Hs, F, K, Q, 8, sig);
  console.log ("bp gas: ", gas);
 })


})
