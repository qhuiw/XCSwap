const assert = require("assert");
const alt_bn128 = artifacts.require("alt_bn128");
const PartialEquality = artifacts.require("PartialEquality");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const Sigma = artifacts.require("Sigma");

const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");

const SoKba = artifacts.require("SoKba");
const SoKab = artifacts.require("SoKab");
const PubParam = artifacts.require("PubParam");

contract("setup", async () => {
  var lib, pp, pe, dg, ba, ab, sigma;
  var rg, x, y, tx, ty;
  const s = 3, T1 = 0, T2 = 10, T3 = 20, Tmax = 30;
  const Bval = 1, Aval = 1;

  before (async () => {
    lib = await alt_bn128.new();
    await PartialEquality.link(lib);
    await DiffGenEqual.link(lib);
    await Sigma.link(lib);
    await SoKba.link(lib);

    /* 1 traded token */
    pp = await PubParam.new(1);
    pe = await PartialEquality.new();
    dg = await DiffGenEqual.new();
    sigma = await Sigma.new();

    ba = await SoKba.new(pp.address, pe.address, dg.address, sigma.address);
    ab = await SoKab.new(pp.address, pe.address, dg.address, sigma.address);

    rg = await TokenRegistrar.new();

    /*  initiate and register NFTs "x" & "y" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);
    tx = await rg.getTy(x.address);
    y = await TokenNFT.new("y", "y");
    await rg.register(y.address);
    ty = await rg.getTy(y.address);
  })

  it ("tests SoKba", async () => {
    const common = [ty, Bval, T2, T3, Tmax, s]; // (y,valy,T2,T3,Tmax,s)

    const beta = [11, 12, 13, 14]; // (b1, b2, b3, b4)

    const pky = await pp.TagKGen(beta[0]);

    const tComEy = await pp.tCom([ty, Bval, T2, T3, beta[0], 0, 0]);

    const ocomEx = await pp.oCom([0,0,0,0,0, beta[0]+s, beta[3]]); // (b1+s, b4)

    const R_By = await pp.Com([ty, Bval, T3, Tmax, beta[0], beta[1], beta[2]]);

    const stm = [common, pky, tComEy, ocomEx, R_By];

    const wit = [s].concat(beta);

    const sig = await ba.sign.call(stm, wit);

    const bool = await ba.verify.call(stm, sig);

    assert.equal(bool, true, "setup B to A failed");
  });

  it ("tests SoKab", async () => {
    const common = [tx, Aval, T1, T2, Tmax]; // (x,valx,T1,T2,Tmax)

    const alpha = [21, 22, 23, 24, 25]; // (a1, a2, a3, a4, a5)
    
    const pkx = await pp.TagKGen(alpha[0]);

    const tComEx = await pp.tCom([tx, Aval, T1, T2, alpha[0], 0, 0]);

    const oComEy = await pp.oCom([0,0,0,0,0, alpha[1], alpha[2]]); // (a2, a3)

    const R_Ax = await pp.Com([tx, Aval, T2, Tmax, alpha[0], alpha[3], alpha[4]]);

    const stm = [common, pkx, tComEx, oComEy, R_Ax];

    const wit = alpha;

    const sig = await ab.sign.call(stm, wit);

    const bool = await ab.verify.call(stm, sig);

    assert.equal(bool, true, "setup A to B failed");
  });
});