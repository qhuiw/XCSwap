const assert = require("assert");
const { performance } = require("perf_hooks");
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

// test redeem
contract("Protocol", async (accounts) => {
  var lib, pp, dr, pe, sg, om;
  var dp, wd, sp, ba, ab;
  var rg, x, y, ty_x, ty_y, mixerX, mixerY;
  
  const ring_size = 64;
  const A = accounts[0], B = accounts[1];
  const valx = 1, valy = 2;
  const T1 = 0, T2 = 10, T3 = 20, Tmax = 30, s = 1;
  // const common = [ty_x, valx, ty_y, valy, T1, T2, T3, s];

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

    mixerX = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
    mixerY = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);

    /*  initiate and register NFTs "x" & "y" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);

    y = await TokenNFT.new("y", "y");
    await rg.register(y.address);

    /* assign Aval to A */
    await x.mint(A, valx);
    ty_x = await rg.getTy(x.address);

    /* assign Bval to B */
    await y.mint(B, valy);
    ty_y = await rg.getTy(y.address);
  })

  /* send to A */
  var pky, tcomE_Ay, ocomE_Bx, R_By, tx_ba, sig_ba;

  it ("tests setup B to A", async () => {
    /* private to B */
    const beta = [1,2,3,4]; // for tcomEy, ocomEx, R_By
    
    pky = await pp.TagKGen(beta[0]);

    /* attr of tcomEy and ocomEx */
    const attrE = [ty_y, valy, T2, T3, beta[0], beta[0]+s, beta[3]];
    tcomE_Ay = await pp.tCom(attrE);
    ocomE_Bx = await pp.oCom(attrE);

    const attrR_By = [ty_y, valy, T3, Tmax, beta[0], beta[1], beta[2]];
    R_By = await pp.Com(attrR_By);

    const c = [ty_y, valy, T2, T3, Tmax, s];
    tx_ba = [c, pky, tcomE_Ay, ocomE_Bx, R_By];
    const wit = [s].concat(beta);

    sig_ba = await ba.sign.call(tx_ba, wit);
  });

  /* send to B */
  var pkx, tcomE_Bx, ocomE_Ay, R_Ax, tx_ab, sig_ab;

  it ("tests setup A to B", async () => {
    const bool = await ba.verify.call(tx_ba, sig_ba);
    assert.equal(bool, true, "setup B to A failed");

    /* private to A */
    const alpha = [5,6,7,8,9];

    pkx = await pp.TagKGen(alpha[0]);
    // attr of tcomEx and ocomEy
    const attrE = [ty_x, valx, T1, T2, alpha[0], alpha[1], alpha[2]];
    tcomE_Bx = await pp.tCom(attrE);
    ocomE_Ay = await pp.oCom(attrE);

    const attrR = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];
    R_Ax = await pp.Com(attrR);

    const c = [ty_x, valx, T1, T2, Tmax];
    tx_ab = [c, pkx, tcomE_Bx, ocomE_Ay, R_Ax];
    const wit = alpha;

    sig_ab = await ab.sign.call(tx_ab, wit);
  });

  it ("tests deposit B", async () => {
    /* private to B */
    const attrP_By = [ty_y, valy, 0, Tmax, 10, 11, 12];

    const onetP_By = await pp.onetAcc(attrP_By);

    const tx_dp = [onetP_By, attrP_By.slice(0, 4)];

    await y.approve.sendTransaction(mixerY.address, valy, {from : B});

    var startTime = performance.now();
    const sig = await mixerY.deposit.call(tx_dp, attrP_By.slice(4), {from : B});
    var endTime = performance.now();
    console.log("Deposit B call time: " + (endTime - startTime) + " ms");

    // await mixerY.deposit.sendTransaction(tx_dp, attrP_By.slice(4), {from : B});

    const bool = await mixerY.process_dp.call(tx_dp, sig, {from : B});

    let tx = await mixerY.process_dp.sendTransaction(tx_dp, sig, {from : B});
    console.log("Deposit B gas used: " + tx.receipt.gasUsed);

    assert.equal(bool, true, "Deposit B failed");

    const y_owner = await y.ownerOf(valy);

    assert.equal(y_owner, mixerY.address, "Deposit B transfer failed");
  });

  it ("tests preswap B to mixerY", async () => {
    const bool = await ab.verify.call(tx_ab, sig_ab);
    assert.equal(bool, true, "setup A to B failed");

    /* private to B */
    const beta = [1,2,3,4];
    const attrP_By = [ty_y, valy, 0, Tmax, 10, 11, 12];
    const attrE = [ty_y, valy, T2, T3, beta[0], beta[0] + s, beta[3]];
    const attrR_By = [ty_y, valy, T3, Tmax, beta[0], beta[1], beta[2]];

    /* spend P_By */
    const P_By = await pp.Com(attrP_By);
    
    const R = Array.from(await mixerY.get_accs()).slice(0, ring_size);

    const theta = 4;
    R[theta] = P_By;

    const gs = R.slice(-Math.log2(ring_size));

    const tagy = await pp.TagEval(attrP_By[4]); // sk in attrP_By
    const tcom_T = [tcomE_Ay, await pp.tCom(attrR_By)];
    const ocom_T = [ocomE_Ay, await pp.oCom(attrR_By)];
    const attrTs = [attrE.slice(2,4).concat([6,7]), [T3, Tmax, beta[1], beta[2]]];

    // opn in attrP_By
    const tx_sp = [R, gs, tagy, [attrP_By[5], 0, Tmax], pky, tcom_T, ocom_T];

    /* skT = tcomE_Ay's sk, generated by B */
    const wit = [theta, [ty_y, valy, attrP_By[4], attrP_By[6]], beta[0], attrTs];

    const startTime = performance.now();
    const sig = await mixerY.spend.call(tx_sp, wit, {from : B});
    const endTime = performance.now();
    console.log("Preswap B to MixerY call time: " + (endTime - startTime) + " ms");

    const b = await mixerY.process_sp.call(tx_sp, sig, {from : B});

    assert.equal(b, true, "Preswap B to mixerY failed");

    let tx = await mixerY.process_sp.sendTransaction(tx_sp, sig, {from : B});
    console.log("Preswap B to MixerY gas used: " + tx.receipt.gasUsed);
  });

  it ("tests deposit A", async () => {
    /* private to A */
    const attrP_Ax = [ty_x, valx, 0, Tmax, 20, 21, 22];

    const onetP_Ax = await pp.onetAcc(attrP_Ax);

    const tx_dp = [onetP_Ax, attrP_Ax.slice(0, 4)];

    await x.approve.sendTransaction(mixerX.address, valx, {from : A});

    const sig = await mixerX.deposit.call(tx_dp, attrP_Ax.slice(4), {from : A});

    const bool = await mixerX.process_dp.call(tx_dp, sig, {from : A});

    await mixerX.process_dp.sendTransaction(tx_dp, sig, {from : A});

    assert.equal(bool, true, "Deposit A failed");

    const x_owner = await x.ownerOf(valx);

    assert.equal(x_owner, mixerX.address, "Deposit A transfer failed");
  });

  it ("tests preswap A to mixerX", async () => {
    /* private to A */
    const alpha = [5,6,7,8,9];
    const attrP_Ax = [ty_x, valx, 0, Tmax, 20, 21, 22];
    const attrE = [ty_x, valx, T1, T2, alpha[0], alpha[1], alpha[2]];
    const attrR_Ax = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];
    
    /* spend P_Ax */
    const P_Ax = await pp.Com(attrP_Ax);

    const R = Array.from(await mixerX.get_accs()).slice(0, ring_size);

    const theta = 4;
    R[theta] = P_Ax;

    const gs = R.slice(-Math.log2(ring_size));

    const tagx = await pp.TagEval(attrP_Ax[4]); // sk in attrP_Ax

    const tcom_T = [tcomE_Bx, await pp.tCom(attrR_Ax)];
    const ocom_T = [ocomE_Bx, await pp.oCom(attrR_Ax)];

    const attrTs = [attrE.slice(2,4).concat([8,9]), [T2, Tmax, alpha[3], alpha[4]]];

    // opnS in attrP_Ax
    const tx_sp = [R, gs, tagx, [attrP_Ax[5], 0, Tmax], pkx, tcom_T, ocom_T];

    /* skT = tcomE_Bx's sk, generated by A */
    const wit = [theta, [ty_x, valx, attrP_Ax[4], attrP_Ax[6]], alpha[0], attrTs];

    const sig = await mixerX.spend.call(tx_sp, wit, {from : A});

    const bool = await mixerX.process_sp.call(tx_sp, sig, {from : A});

    assert.equal(bool, true, "Preswap A to MixerX failed");

    await mixerX.process_sp.sendTransaction(tx_sp, sig, {from : A});

  });

  it ("tests redeem A to mixerX", async () => {

    const R = Array.from(await mixerX.get_accs()).slice(0, ring_size);

    const theta = 4;
    R[theta] = R_Ax;

    const gs = R.slice(-Math.log2(ring_size));

    /* private to A */
    const alpha = [5,6,7,8,9];

    const tagS = await pp.TagEval(alpha[0]);

    const attrR_Ax = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];
    const attrP_Ax = [ty_x, valx, T2, Tmax, 30, 31, 32];

    const pkT = await pp.TagKGen(attrP_Ax[4]);
    const tcom_T = [await pp.tCom(attrP_Ax)];
    const ocom_T = [await pp.oCom(attrP_Ax)];

    const tx_sp = [R, gs, tagS, [attrR_Ax[5], attrR_Ax[2], attrR_Ax[3]], pkT, tcom_T, ocom_T];

    const attrTs = [[attrP_Ax[2], attrP_Ax[3], attrP_Ax[5], attrP_Ax[6]]];

    const wit = [theta, [ty_x, valx, attrR_Ax[4], attrR_Ax[6]], attrP_Ax[4], attrTs];

    const startTime = performance.now();
    const sig = await mixerX.spend.call(tx_sp, wit, {from : A});
    const endTime = performance.now();
    console.log("Redeem A to MixerX call time: " + (endTime - startTime) + " ms");

    const b = await mixerX.process_sp.call(tx_sp, sig, {from : A});
    assert.equal(b, true, "Redeem A to MixerX failed");

    let tx = await mixerX.process_sp.sendTransaction(tx_sp, sig, {from : A});
    console.log("Redeem A to MixerX gas used: " + tx.receipt.gasUsed);

  });

  // /* send to B */
  // var a1;

  // it("tests offchain A to B", async () => {
  //   const E_Ay = await pp.com([tcomE_Ay, ocomE_Ay]);
  //   const bool = await mixerY.inAcc(E_Ay);
  //   assert.equal(bool, true, "E_Ay not in MixerY");

  //   /* private to A */
  //   const alpha = [5,6,7,8,9];
  //   a1 = alpha[0];
  // });

  // var tx_bx;

  // it ("tests exchange B to MixerX", async () => {
  //   assert(await pp.TagKGen(a1), pkx, "A has given the false sk");

  //   /* spend E_Bx */
  //   const E_Bx = await pp.com([tcomE_Bx, ocomE_Bx]);
  //   const bool = await mixerX.inAcc(E_Bx);
  //   assert.equal(bool, true, "E_Bx not in MixerX");

  //   const R = Array.from(await mixerX.get_accs()).slice(0, ring_size);

  //   const theta = 4;

  //   R[theta] = E_Bx;

  //   const gs = R.slice(-Math.log2(ring_size));

  //   const tagS = await pp.TagEval(a1);

  //   /* private to B, mint P_Bx */
  //   const beta = [1,2,3,4];
  //   const attrP_Bx = [ty_x, valx, T2, Tmax, 30, 31, 32];

  //   // use sk of target acc P_Bx
  //   const pkT = await pp.TagKGen(attrP_Bx[4]);

  //   const tcom_T = [await pp.tCom(attrP_Bx)];
  //   const ocom_T = [await pp.oCom(attrP_Bx)];

  //   const attrTs = [[attrP_Bx[2], attrP_Bx[3], attrP_Bx[5], attrP_Bx[6]]];

  //   // opnS in attrE_Bx
  //   const tx_sp = [R, gs, tagS, [beta[0]+s, T1, T2], pkT, tcom_T, ocom_T];
  //   tx_bx = tx_sp;

  //   // sk in attrE_Bx = a1, 
  //   // ok in attrE_Bx = beta[3]
  //   const wit = [theta, [ty_x, valx, a1, beta[3]], attrP_Bx[4], attrTs];

  //   const startTime = performance.now();
  //   const sig = await mixerX.spend.call(tx_sp, wit, {from : B});
  //   const endTime = performance.now();
  //   console.log("Exchange B to MixerX call time: " + (endTime - startTime) + " ms");

  //   const b = await mixerX.process_sp.call(tx_sp, sig, {from : B});

  //   assert.equal(b, true, "Exchange B to MixerX failed");

  //   let tx = await mixerX.process_sp.sendTransaction(tx_sp, sig, {from : B});
  //   console.log("Exchange B to MixerX gas used: " + tx.receipt.gasUsed);
  // });

  // it ("tests exchange A to MixerY", async () => {
  //   const tag = await pp.TagEval(a1);
  //   const b = await mixerX.inTag(tag);
  //   assert.equal(b, true, "B does not spend E_Bx");

  //   const R = Array.from(await mixerY.get_accs()).slice(0, ring_size);
  //   const theta = 4;
  //   const E_Ay = await pp.com([tcomE_Ay, ocomE_Ay]);
  //   R[theta] = E_Ay;

  //   const gs = R.slice(-Math.log2(ring_size));

  //   // b1 = opn(TX_Bx) - s
  //   const beta = tx_bx[3][0] - s;
  //   const tagS = await pp.TagEval(beta);

  //   /* private to A, mint P_Ay */
  //   const alpha = [5,6,7,8,9];
  //   const attrP_Ay = [ty_y, valy, T3, Tmax, 40, 41, 42];

  //   // use sk of target acc P_Ay
  //   const pkT = await pp.TagKGen(attrP_Ay[4]);

  //   const tcom_T = [await pp.tCom(attrP_Ay)];
  //   const ocom_T = [await pp.oCom(attrP_Ay)];

  //   const attrTs = [[attrP_Ay[2], attrP_Ay[3], attrP_Ay[5], attrP_Ay[6]]];

  //   const tx_sp = [R, gs, tagS, [alpha[1], T2, T3], pkT, tcom_T, ocom_T];
  //   const wit = [theta, [ty_y, valy, beta, alpha[2]], attrP_Ay[4], attrTs];

  //   const sig = await mixerY.spend.call(tx_sp, wit, {from : A});

  //   const bool = await mixerY.process_sp.call(tx_sp, sig, {from : A});

  //   assert.equal(bool, true, "Exchange A to MixerY failed");

  //   await mixerY.process_sp.sendTransaction(tx_sp, sig, {from : A});

  // });

  // it ("tests B withdraw token x", async () => {
  //   const attrP_Bx = [ty_x, valx, T2, Tmax, 30, 31, 32];
  //   const P_Bx = await pp.Com(attrP_Bx);

  //   const R = Array.from(await mixerX.get_accs()).slice(0, ring_size);
  //   const theta = 4;
  //   R[theta] = P_Bx;

  //   const gs = R.slice(-Math.log2(ring_size));

  //   const tag = await pp.TagEval(attrP_Bx[4]);

  //   const tx_wd = [R, gs, tag, attrP_Bx.slice(0, 4), B];

  //   const wit = [theta].concat(attrP_Bx.slice(4));

  //   const startTime = performance.now();
  //   const sig = await mixerX.withdraw.call(tx_wd, wit);
  //   const endTime = performance.now();
  //   console.log("B Withdraw from MixerX call time: " + (endTime - startTime) + " ms");

  //   const b = await mixerX.process_wd.call(tx_wd, sig);

  //   assert.equal(b, true, "B Withdraw from MixerX failed");

  //   let tx = await mixerX.process_wd.sendTransaction(tx_wd, sig);
  //   console.log("B Withdraw from MixerX gas used: " + tx.receipt.gasUsed);
    
  //   const x_owner = await x.ownerOf(valx);
  //   assert.equal(x_owner, B, "B Withdraw from MixerX transfer failed");
  // });

  // it ("tests A withdraw token y", async () => {
  //   const attrP_Ay = [ty_y, valy, T3, Tmax, 40, 41, 42];
  //   const P_Ay = await pp.Com(attrP_Ay);
  //   const tag = await pp.TagEval(attrP_Ay[4]);

  //   const R = Array.from(await mixerY.get_accs()).slice(0, ring_size);
  //   const theta = 4;
  //   R[theta] = P_Ay;

  //   const gs = R.slice(-Math.log2(ring_size));

  //   const tx_wd = [R, gs, tag, attrP_Ay.slice(0, 4), A];

  //   const wit = [theta].concat(attrP_Ay.slice(4));

  //   const sig = await mixerY.withdraw.call(tx_wd, wit);

  //   const b = await mixerY.process_wd.call(tx_wd, sig);

  //   assert.equal(b, true, "A Withdraw from MixerY failed");

  //   await mixerY.process_wd.sendTransaction(tx_wd, sig);

  //   const y_owner = await y.ownerOf(valy);
  //   assert.equal(y_owner, A, "A Withdraw from MixerY transfer failed");
  // });

})
