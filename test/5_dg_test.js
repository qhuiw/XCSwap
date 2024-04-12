const alt_bn128 = artifacts.require("alt_bn128");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const PubParam = artifacts.require("PubParam");
const assert = require("assert");

contract("DiffGenEqual", async () => {
  var pp, dg, lib;
  const n_ty = 1;
  const x = [1,2,3,4,5,6,7];
  const y = [1,2,3,4,0,0,0];
  const i_ne = [4,5,6];

  before (async () => {
    lib = await alt_bn128.deployed();
    await PubParam.link(lib);
    await DiffGenEqual.link(lib);
    pp = await PubParam.new(n_ty);
    dg = await DiffGenEqual.new();
  })

  it ("tests dg", async () => {
    const gx = await pp.g_tag();
    const gys = await pp.gs();
    const y = [1,2,3,4,5,6,7];

    const sig = await dg.sign(gx, gys, 4, 0, y);
    const Cx = await pp.TagEval(y[4]);
    const Cy = await pp.Com(y);
    const b = await dg.verify(gx, gys, 4, Cx, Cy, sig);
    assert (b == true, "DG failed");
    
    const gas = await dg.verify.estimateGas(gx, gys, 4, Cx, Cy, sig);
    console.log ("DG gas: ", gas);
  })



})