const alt_bn128 = artifacts.require("alt_bn128");
const PartialEquality = artifacts.require("PartialEquality");
const PubParam = artifacts.require("PubParam");
const assert = require("assert");

contract("PartialEquality", async () => {
  var pp, pe, lib;
  const n_ty = 1;
  const x = [1,2,3,4,5,6,7];
  const y = [0,0,3,4,0,6,0];
  const i_ne = [0,1,4,6];

  before (async () => {
    lib = await alt_bn128.deployed();
    await PubParam.link(lib);
    await PartialEquality.link(lib);
    pp = await PubParam.new(n_ty);
    pe = await PartialEquality.new();
  })

  it ("tests pe", async () => {
    const gs = await pp.gs();
    const sig = await pe.sign(gs, x, y, i_ne);
    const Cx = await pp.Com(x);
    const Cy = await pp.Com(y);
    const b = await pe.verify(gs, i_ne, Cx, Cy, sig);
    assert.equal(b, true, "PE failed");

    const gas = await pe.verify.estimateGas(gs, i_ne, Cx, Cy, sig);
    console.log ("PE gas: ", gas);
  })

  // it ("tests revised pe", async () => {
  //   var gs = await pp.gs();
  //   const sig = await pe.sign(gs.slice(4), x.slice(4), y.slice(4));
  //   const Cx = await pp.Com(x);
  //   const Cy = await pp.Com(y);
  //   const b = await pe.verify(gs.slice(4), Cx, Cy, sig);
  //   assert.equal(b, true, "Partial failed");
  // })

})