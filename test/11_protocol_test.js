const assert = require("assert");
// const contract = require("@truffle/contract");

const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartialEquality = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const OneofMany = artifacts.require("OneofMany");
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
  var lib, pp, dr, pe, sg, om;
  var dp, wd, sp, ba, ab;
  var rg, x, y, ty_x, ty_y, mixerA, mixerB;
  // var sk_pos;
  
  const ring_size = 16;
  const max = 2**53-1;
  const A = accounts[0], B = accounts[1];
  const Aval = 1, Bval = 2;
  const T1 = 0, T2 = 10, T3 = 20, Tmax = 30, s = 1;
  const common = [ty_x, Aval, ty_y, Bval, T1, T2, T3, s];

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
    await OneofMany.link(lib);

    /* 1 traded token */
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    om = await OneofMany.new();
    dg = await DiffGenEqual.new();
    sg = await Sigma.new();

    /* set up */
    ba = await SoKba.new(pp.address, pe.address, dg.address, sg.address);
    ab = await SoKab.new(pp.address, pe.address, dg.address, sg.address);
    /* mixer */
    dp = await SoKdp.new(pp.address, pe.address);
    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address, om.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address, om.address);

    /* token registrar */
    rg = await TokenRegistrar.new();

    mixerA = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
    mixerB = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);

    /*  initiate and register NFTs "x" & "y" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);

    y = await TokenNFT.new("y", "y");
    await rg.register(y.address);

    /* assign Aval to A */
    await x.mint(A, Aval);
    ty_x = await rg.getTy(x.address);

    /* assign Bval to B */
    await y.mint(B, Bval);
    ty_y = await rg.getTy(y.address);

    /* initialise var */
    // sk_pos = await pp.sk_pos();

    /**
     * Note for testing purpose only, 
     * T1, T2 = 0, max
     * T2, T3 = 0, max
     **/ 
    // const EAy = [ty_y, Bval, 0, new BN(max), beta[1], alpha[2], alpha[3]];
    // const EBx = [ty_x, Aval, 0, new BN(max), alpha[1], beta[1] + s, beta[4]];
    // tcomEy = await pp.tCom(EAy);
    // ocomEx = await pp.oCom(EBx);

  })

  /* send to A */
  var pky, tcomEy, ocomEx, R_By, tx_ba, sig_ba;

  it ("tests setup B to A", async () => {
    const beta = [1,2,3,4];
    
    pky = await pp.TagKGen(beta[0]);

    // attr of tcomEy and ocomEx
    const attrE = [ty_y, Bval, T2, T3, beta[0], beta[0] + s, beta[3]];
    tcomEy = await pp.tCom(attrE);
    ocomEx = await pp.oCom(attrE);

    const attrR = [ty_y, Bval, T3, Tmax, beta[0], beta[1], beta[2]];
    R_By = await pp.Com(attrR);

    const c = [ty_y, Bval, T2, T3, Tmax, s];
    tx_ba = [c, pky, tcomEy, ocomEx, R_By];
    const wit = [s].concat(beta);

    sig_ba = await ba.sign.call(tx_ba, wit);
  });

  /* send to B */
  var pkx, tcomEx, ocomEy, R_Ax, tx_ab, sig_ab;

  it ("tests setup A to B", async () => {
    const bool = await ba.verify.call(tx_ba, sig_ba);
    assert.equal(bool, true, "setup B to A failed");

    const alpha = [5,6,7,8,9];

    pkx = await pp.TagKGen(alpha[0]);
    // attr of tcomEx and ocomEy
    const attrE = [ty_x, Aval, T1, T2, alpha[0], alpha[1], alpha[2]];
    tcomEx = await pp.tCom(attrE);
    ocomEy = await pp.oCom(attrE);

    const attrR = [ty_x, Aval, T2, Tmax, alpha[0], alpha[3], alpha[4]];
    R_Ax = await pp.Com(attrR);

    const c = [ty_x, Aval, T1, T2, Tmax];
    tx_ab = [c, pkx, tcomEx, ocomEy, R_Ax];
    const wit = alpha;

    sig_ab = await ab.sign.call(tx_ab, wit);
  });

  var P_By;

  it ("tests deposit B", async () => {
    const attrP_By = [ty_y, Bval, 0, Tmax, 10, 11, 12];
    P_By = await pp.Com(attrP_By);
    const onetP_By = await pp.onetAcc(attrP_By);

    const tx_dp = [onetP_By, attrP_By.slice(0, 4)];

    const sig = await mixerB.deposit.call(tx_dp, attrP_By.slice(4), {from : B});

    await mixerB.deposit(tx_dp, attrP_By.slice(4), {from : B});

    const bool = await mixerB.process_dp.call(tx_dp, sig, {from : B});

    await mixerB.process_dp(tx_dp, sig, {from : B});

    assert.equal(bool, true, "Deposit B failed");

  });

  it ("tests preswap B to mixerB", async () => {
    const beta = [1,2,3,4];
    const bool = await ab.verify.call(tx_ab, sig_ab);
    assert.equal(bool, true, "setup A to B failed");

    const R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }

    const theta = 4;

    const gs = new Array(Math.log2(ring_size));

    for (var i = 0; i < gs.length; i++) {
      gs[i] = await pp.randomAcc();
    }






  })


  // it("tests Preswap B to Mixer y", async () => {
  //   const PBy = [ty_y, valB, 0, new BN(max), beta[0], beta[0]+10, beta[1]]; // in practice sk, opn are different

  //   const pky = await pp.TagKGen(PBy[sk_pos]);

  //   const theta = 4;
  //   /* intialise R */
  //   const R = new Array(ring_size);
  //   for (var i = 0; i < ring_size; i++) {
  //     R[i] = await pp.randomAcc();
  //   }

  //   const acc = await pp.Com(PBy);
  //   R[theta] = acc;

    

    



  // })



})
