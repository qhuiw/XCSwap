const assert = require("assert");
const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartialEquality = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const OneofMany = artifacts.require("OneofMany");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const PubParam = artifacts.require("PubParam");
const BN = require("bn.js")

contract("Mixer Deposit & Withdraw", async (accounts) => {
  var lib, pp, mixer, pe, dr, dg, om;
  var dp, wd, sp;
  var rg, x, ty;
  const max = 2**53-1;
  const A = accounts[0];
  const Aval = 1;
  const theta = 4;
  const ring_size = 16;
  var AattrP;
  
  before (async () => {
    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);
    await SoKdp.link(lib);
    await SoKwd.link(lib);
    await SoKsp.link(lib);
    await PartialEquality.link(lib);
    await DualRing.link(lib);
    await DiffGenEqual.link(lib);
    await OneofMany.link(lib);

    /* 1 traded token */
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();
    om = await OneofMany.new();

    dp = await SoKdp.new(pp.address, pe.address);
    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address, om.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address, om.address);

    rg = await TokenRegistrar.new();

    mixer = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);

    /*  initiate and register a NFT "x" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);

    /*  assign Aval to acc A */
    await x.mint(A, Aval);
    ty = await rg.getTy(x.address);

    /* initialise attr */
    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];
  })

  it ("tests deposit", async () => {
    const onetacc = await pp.onetAcc(AattrP);
    
    const tx_dp = [onetacc, AattrP.slice(0, 4)];

    const sig = await mixer.deposit.call(tx_dp, AattrP.slice(4), {from : A}); 

    await mixer.deposit(tx_dp, AattrP.slice(4), {from : A});

    const b = await mixer.process_dp.call(tx_dp, sig, {from : A});

    await mixer.process_dp.sendTransaction(tx_dp, sig, {from : A});

    assert.equal(b, true, "Deposit failed");    
  })

  it ("tests withdraw, idx = " + theta, async () => {
    const acc = await pp.Com(AattrP);

    const bool = await mixer.isValid([acc]);

    assert.equal(bool, true, "Account deposit failed");

    /* Warning: need to convert iterable to array */
    const rr = await mixer.get_accs();
    const R = Array.from(rr).slice(0, ring_size);
    R[theta] = acc;

    const gs = R.slice(- Math.log2(ring_size));

    const sk_pos = await pp.sk_pos();
    const sk = AattrP[sk_pos];

    const tag = await pp.TagEval(sk);

    const tx_wd = [R, gs, tag, AattrP.slice(0, sk_pos), A];

    const wit = [theta].concat(AattrP.slice(sk_pos));

    const sig = await mixer.withdraw.call(tx_wd, wit);

    const b = await mixer.process_wd.call(tx_wd, sig);

    assert.equal(b, true, "Withdraw failed");
  });

})

/////////////////////// Spend /////////////////////
contract("Mixer Spend", async (accounts) => {
  var lib, pp, mixer, pe, dr, dg, om;
  var dp, wd, sp;
  var rg, x, ty;
  const max = 2**53-1;
  const A = accounts[0];
  const Aval = 1;
  const theta = 4;
  const ring_size = 16;
  var AattrP;
  
  before (async () => {
    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);
    await SoKdp.link(lib);
    await SoKwd.link(lib);
    await SoKsp.link(lib);
    await PartialEquality.link(lib);
    await DualRing.link(lib);
    await DiffGenEqual.link(lib);
    await OneofMany.link(lib);

    /* 1 traded token */
    pp = await PubParam.new(1); 
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();
    om = await OneofMany.new();

    dp = await SoKdp.new(pp.address, pe.address);
    wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address, om.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address, om.address);

    rg = await TokenRegistrar.new();

    mixer = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);

    /*  initiate and register a NFT "x" */
    x = await TokenNFT.new("x", "x");
    await rg.register(x.address);

    /*  assign Aval to acc A */
    await x.mint(A, Aval);
    ty = await rg.getTy(x.address);

    /* initialise attr */
    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];
  })

  it ("tests deposit", async () => {
    const onetacc = await pp.onetAcc(AattrP);
    
    const tx_dp = [onetacc, AattrP.slice(0, 4)];

    const sig = await mixer.deposit.call(tx_dp, AattrP.slice(4), {from : A}); 

    await mixer.deposit(tx_dp, AattrP.slice(4), {from : A});

    const b = await mixer.process_dp.call(tx_dp, sig, {from : A});

    await mixer.process_dp.sendTransaction(tx_dp, sig, {from : A});

    assert.equal(b, true, "Deposit failed");    
  })

  it ("tests spend", async () => {
    const T_beg = AattrP[2];
    const T_end = AattrP[3];
    const sk = AattrP[4];
    const opn = AattrP[5];
    const ok = AattrP[6];

    /* R and gs */
    const rr = await mixer.get_accs();
    const R = Array.from(rr).slice(0, ring_size);

    const acc = await pp.Com(AattrP);
    R[theta] = acc;

    const gs = rr.slice(- Math.log2(ring_size));

    const tag = await pp.TagEval(sk);
    /* random target account */
    const skT = sk-1;
    const pkT = await pp.TagKGen(skT); 
    const attrT = [ty, Aval, 1, 2, skT, 3, 4];
    const tcom_Ts = [await pp.tCom(attrT)];
    const ocom_Ts = [await pp.oCom(attrT)];

    const tx_sp = [R, gs, tag, [opn, T_beg, T_end], pkT, tcom_Ts, ocom_Ts];

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
