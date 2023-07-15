const assert = require("assert");
const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
// const PE = artifacts.require("PartialEquality");
const PubParam = artifacts.require("PubParam");
const BN = require("bn.js")

contract("Token", async (accounts) => {
  var lib, reg, x, pp, mixer;
  const max = 2**53-1;
  const A = accounts[0];
  const Aval = 1;
  var AattrP;
  
  before (async () => {
    reg = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    await reg.register(x.address);

    lib = await alt_bn128.new();
    await Mixer.link(lib);
    await PubParam.link(lib);
    pp = await PubParam.new(1); // max_ty
    mixer = await Mixer.new(reg.address, pp.address);
  })

  it ("tests deposit", async () => {
    await x.mint(A, Aval);
    const ty = await reg.getTy(x.address);
    // new BN(RandomUint(max))
    AattrP = [ty, Aval, 0, new BN(max), new BN(RandomUint(max)), new BN(RandomUint(max)), new BN(RandomUint(max))];

    const onetacc = await pp.onetAcc(AattrP);
    
    const tx_dp = [onetacc, AattrP.slice(0, 4)];
    // deposit
    const sig = await mixer.deposit.call(tx_dp, AattrP.slice(4), {from : A}); 

    const b = await mixer.process_dp(tx_dp, sig);
    // const b = await mixer.test(sig);
    assert (b, true, "Deposit failed");
  })

  it ("tests withdraw", async () => {
    const ring_size = 16;
    const skj = [AattrP[4], 8]; // (sk, theta)


  })


})

function RandomUint(max) {
  return Math.floor(Math.random() * max) + 1;
}