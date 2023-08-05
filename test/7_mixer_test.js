const assert = require("assert");
const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartialEquality = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const DiffGenEqual = artifacts.require("DiffGenEqual");

const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const PubParam = artifacts.require("PubParam");
const BN = require("bn.js")

contract("Mixer Deposit & Withdraw", async (accounts) => {
  var lib, reg, x, pp, mixer, pe, wd, sp;
  const max = 2**53-1;
  const A = accounts[0];
  const Aval = 1;
  const theta = 4;
  const ring_size = 16;
  var R, ty, AattrP, sk, tag, sk_pos;
  
  before (async () => {
    // initiate and register a NFT "x"
    reg = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    await reg.register(x.address);

    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);
    await SoKwd.link(lib);
    await SoKsp.link(lib);
    await PartialEquality.link(lib);
    await DualRing.link(lib);
    await DiffGenEqual.link(lib);

    // 1 traded token
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();

    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address);

    mixer = await Mixer.new(reg.address, pp.address, pe.address, dr.address, dg.address, wd.address, sp.address);

    // intialise variables
    sk_pos = await pp.sk_pos();

    R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }

    // assign Aval to user A
    await x.mint(A, Aval);
    ty = await reg.getTy(x.address);

    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];
    T_beg = AattrP[2];
    T_end = AattrP[3];
    sk = AattrP[4];
    opn = AattrP[5];
    ok = AattrP[6];
  })

  it ("tests deposit", async () => {
    const onetacc = await pp.onetAcc(AattrP);
    
    const tx_dp = [onetacc, AattrP.slice(0, 4)];
    // deposit
    const sig = await mixer.deposit.call(tx_dp, AattrP.slice(4), {from : A}); 

    await mixer.deposit(tx_dp, AattrP.slice(4), {from : A});

    const b = await mixer.process_dp.call(tx_dp, sig, {from : A});

    await mixer.process_dp.sendTransaction(tx_dp, sig, {from : A});

    assert.equal(b, true, "Deposit failed");
  })


  it ("tests withdraw, idx = " + theta, async () => {
    const acc = await pp.Com(AattrP);

    R[theta] = acc;

    tag = await pp.TagEval(sk);

    const tx_wd = [R, tag, AattrP.slice(0, sk_pos), A];

    const wit = [theta].concat(AattrP.slice(sk_pos));

    const sig = await mixer.withdraw.call(tx_wd, wit);

    const b = await mixer.process_wd.call(tx_wd, sig);

    assert.equal(b, true, "Withdraw failed");
  })
})


contract("Mixer Spend", async (accounts) => {
  var lib, reg, x, pp, mixer, pe, wd, sp;
  const max = 2**53-1;
  const A = accounts[0];
  const Aval = 1;
  const theta = 4;
  const ring_size = 16;
  var R, ty, AattrP, sk, tag, opn, T_beg, T_end, ok;
  
  before (async () => {
    // initiate and register a NFT "x"
    reg = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    await reg.register(x.address);

    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);
    await SoKwd.link(lib);
    await SoKsp.link(lib);
    await PartialEquality.link(lib);
    await DualRing.link(lib);
    await DiffGenEqual.link(lib);

    // 1 traded token
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();

    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address);

    mixer = await Mixer.new(reg.address, pp.address, pe.address, dr.address, dg.address, wd.address, sp.address);

    // intialise variables
    R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }

    // assign Aval to user A
    await x.mint(A, Aval);
    ty = await reg.getTy(x.address);

    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];
    T_beg = AattrP[2];
    T_end = AattrP[3];
    sk = AattrP[4];
    opn = AattrP[5];
    ok = AattrP[6];
  })

  it ("tests spend", async () => {
    const acc = await pp.Com(AattrP);
    R[theta] = acc;

    tag = await pp.TagEval(sk);

    // used for testing correctness
    const skT = sk;
    const pkT = await pp.TagKGen(skT); 
    const attrT = [ty, Aval, 1, 2, skT, 3, 4];
    const tcom_Ts = [await pp.tCom(attrT)];
    const ocom_Ts = [await pp.oCom(attrT)];

    const tx_sp = [R, tag, [opn, T_beg, T_end], pkT, tcom_Ts, ocom_Ts];

    const attrTs = [[1,2,3,4]];

    const wit = [theta, [ty, Aval, sk, ok], skT, attrTs];

    const sig = await mixer.spend.call(tx_sp, wit);

    const b = await mixer.process_sp.call(tx_sp, sig);

    // const sig = await sp.sign.call(tx_sp, wit);
    // const b = await sp.verify.call(tx_sp, sig);

    assert.equal(b, true, "Spend failed");
  })
})

function RandomUint(max) {
  return Math.floor(Math.random() * max) + 1;
}