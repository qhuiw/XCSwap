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

contract("Token", async (accounts) => {
  var lib, reg, x, pp, mixer, pe , R;
  const max = 2**53-1;
  const A = accounts[0];
  const B = accounts[1];
  const Aval = 1;
  var AattrP, sk;
  
  before (async () => {
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

    pp = await PubParam.new(1); // max_ty

    sok = await SoKwd.new(pp.address);
    await Mixer.link(sok);

    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();

    // mixer = await Mixer.new(reg.address, pp.address, pe.address, sok.address, { gas: 5000000 });

    mixer = await Mixer.new(reg.address, pp.address, pe.address, dr.address, dg.address, sok.address, {gas : 5000000});

    const ring_size = 16;
    R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }
  })

  it ("tests deposit", async () => {
    await x.mint(A, Aval);
    const ty = await reg.getTy(x.address);
    // new BN(RandomUint(max))
    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];
    sk = AattrP[4];

    const onetacc = await pp.onetAcc(AattrP);
    
    const tx_dp = [onetacc, AattrP.slice(0, 4)];
    // deposit
    const sig = await mixer.deposit.call(tx_dp, AattrP.slice(4), {from : A}); 

    await mixer.deposit(tx_dp, AattrP.slice(4), {from : A});

    const b = await mixer.process_dp.call(tx_dp, sig, {from : A});

    await mixer.process_dp.sendTransaction(tx_dp, sig, {from : A});

    assert.equal(b, true, "Deposit failed");
  })


  it ("tests withdraw, idx = 4", async () => {

    const acc = await pp.Com(AattrP);

    R[4] = acc;

    const tag = await pp.TagEval(sk);

    const tx_wd = [R, tag, AattrP.slice(0, 4), A];

    const wit = [4].concat(AattrP.slice(4));

    const sig = await mixer.withdraw.call(tx_wd, wit);

    const b = await mixer.process_wd.call(tx_wd, sig);

    assert.equal(b, true, "Withdraw failed");
  })


})

function RandomUint(max) {
  return Math.floor(Math.random() * max) + 1;
}