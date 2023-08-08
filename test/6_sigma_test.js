const alt_bn128 = artifacts.require("alt_bn128");
const Sigma = artifacts.require("Sigma");
const assert = require("assert");
const BN = require("bn.js");

contract("Sigma", async () => {
  var lib, sigma;
  const s = 3;
  const b = [1,2];
  

  before (async () => {
    lib = await alt_bn128.new();
    await Sigma.link(lib);
    sigma = await Sigma.new();
  })

  it("tests plain sigma", async () => {
    const pp = await sigma.setup.call(b);
    const gs = pp[0];
    const c = pp[1];
    const sig = await sigma.sign.call(gs, b);
    const bool = await sigma.verify.call(gs, c, sig);

    assert.equal(bool, true, "plain sigma failed");
  })

  it("tests sum sigma", async () => {
    const sj = [s,0];

    const pp = await sigma.setup.call(b);
    const gs = pp[0];
    const c = pp[1];

    const sig = await sigma.signSum.call(gs, b, sj);

    const bool = await sigma.verifySum.call(gs, c, sig, sj);

    assert.equal(bool, true, "sum sigma failed");
  })

});