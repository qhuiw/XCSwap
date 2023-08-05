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

contract("Mixer", async (accounts) => {
  var lib, reg, x, pp, mixer, pe, wd, sp;
  const max = 2**53-1;
  const A = accounts[0];
  // const B = accounts[1];
  const Aval = 1;
  const theta = 4;
  const ring_size = 16;
  var R, ty, AattrP, sk, tag, opn, T_beg, T_end, ok, sk_pos;
  
  before (async () => {
    reg = await TokenRegistrar.new();
    // initiate and register a NFT "x"
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

    pp = await PubParam.new(1); // 1 traded token
    pe = await PartialEquality.new();
    dr = await DualRing.new();
    dg = await DiffGenEqual.new();

    // wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address);
    sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address);

    // mixer = await Mixer.new(reg.address, pp.address, pe.address, dr.address, dg.address, wd.address, sp.address);

    // intialise variables
    sk_pos = await pp.sk_pos();

    R = new Array(ring_size);
    for (var i = 0; i < ring_size; i++) {
      R[i] = await pp.randomAcc();
    }

    // assign Aval to user A
    await x.mint(A, Aval);
    ty = await reg.getTy(x.address);

    AattrP = [ty, Aval,0,1,2,3,4];
    T_beg = AattrP[2];
    T_end = AattrP[3];
    sk = AattrP[4];
    opn = AattrP[5];
    ok = AattrP[6];
  })

  it ("tests dr", async () => {

    const acc = await pp.Com(AattrP);

    R[theta] = acc;

    tag = await pp.TagEval(sk);
    const skT = sk;
    const pkT = await pp.TagKGen(skT); // used for testing correctness
    const attrT = [ty, Aval, 1, 2, skT, 3, 4];
    const tcom_Ts = [await pp.tCom(attrT)];
    const ocom_Ts = [await pp.oCom(attrT)];
    const attrTs = [[1,2,3,4]];

    const tx_sp = [R, tag, [AattrP[5], AattrP[2], AattrP[3]], pkT, tcom_Ts, ocom_Ts];

    const wit = [theta, [AattrP[0], AattrP[1], AattrP[4], AattrP[6]], skT, attrTs];

    const sig = await sp.sign.call(tx_sp, wit);

    const b = await sp.verify_.call(tx_sp, sig);
  })




})