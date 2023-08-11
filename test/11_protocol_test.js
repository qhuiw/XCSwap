const assert = require("assert");
const contract = require("@truffle/contract");

const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartialEquality = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const Sigma = artifacts.require("Sigma");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const SoKba = artifacts.require("SoKba");
const SoKab = artifacts.require("SoKab");
const PubParam = artifacts.require("PubParam");
const BN = require("bn.js")

contract("Protocol", async (accounts) => {
  var lib, pp, pe, dp, sg, wd, sp, ba, ab;
  var rg, x, y, mixerA, mixerB;
  var ty_x, ty_y, sk_pos;

  const max = 2**53-1;
  const A = accounts[0];
  const B = accounts[1];
  const Aval = 1, Bval = 2;
  const ring_size = 16;

  const s = 1;
  const beta = [1,2,3,4];
  const alpha = [5,6,7,8,9];
  const T1 = 0; T2 = 10; T3 = 20; Tmax = 30;
  const common = [ty_x, Aval, ty_y, Bval, T1, T2, T3, s];

  var tcomEy, ocomEx, R_By;



 

  before (async () => {
    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);

    await SoKdp.link(lib);
    await SoKwd.link(lib);
    await SoKsp.link(lib);
    await SoKba.link(lib);
    await SoKab.link(lib);

    await PartialEquality.link(lib);
    await DualRing.link(lib);
    await DiffGenEqual.link(lib);
    await Sigma.link(lib);

    /* 1 traded token */
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();
    sg = await Sigma.new();

    dp = await SoKdp.new(pp.address, pe.address);
    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address);
    ba = await SoKba.new(pp.address, pe.address, dg.address, sg.address);
    ab = await SoKab.new(pp.address, pe.address, dg.address, sg.address);

    rg = await TokenRegistrar.new();

    mixerA = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
    mixerB = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);

    /*  initiate and register NFTs "x" & "y" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);

    y = await TokenNFT.new("y", "y");
    await rg.register(y.address);

    /*  assign Aval to acc A */
    await x.mint(A, Aval);
    ty_x = await rg.getTy(x.address);

    await y.mint(B, Bval);
    ty_y = await rg.getTy(y.address);

    /* initialise var */
    sk_pos = await pp.sk_pos();

    /**
     * Note for testing purpose only, 
     * T1, T2 = 0, max
     * T2, T3 = 0, max
     **/ 
    const EAy = [ty_y, Bval, 0, new BN(max), beta[1], alpha[2], alpha[3]];
    const EBx = [ty_x, Aval, 0, new BN(max), alpha[1], beta[1] + s, beta[4]];
    tcomEy = await pp.tCom(EAy);
    ocomEx = await pp.oCom(EBx);

  })

  it("tests Preswap B to Mixer y", async () => {
    const PBy = [ty_y, valB, 0, new BN(max), beta[0], beta[0]+10, beta[1]]; // in practice sk, opn are different

    const pky = await pp.TagKGen(PBy[sk_pos]);

    const theta = 4;
    /* intialise R */
    const R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }

    const acc = await pp.Com(PBy);
    R[theta] = acc;

    

    



  })



})
