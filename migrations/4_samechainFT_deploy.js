const alt_bn128 = artifacts.require("alt_bn128");
const MixerFactory = artifacts.require("MixerFactory");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const NFTFactory = artifacts.require("NFTFactory");
const TokenFT = artifacts.require("TokenFT");
const FTFactory = artifacts.require("FTFactory");
const PartEqual = artifacts.require("PartialEquality");
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
const RelayRegistry = artifacts.require("RelayRegistry");

const overwritable = false;

/* for same chain transaction */

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(FTFactory, {overwrite: overwritable});

  /* Create FTs a, b by Factory pattern */
  const ftf = await FTFactory.deployed();
  await ftf.createFT("a", "a");
  await ftf.createFT("b", "b");
  const tokenAddrsFT = await ftf.getTokens();

  /* register token x and y */
  const reg = await TokenRegistrar.deployed();
  await reg.register(tokenAddrsFT[0]);
  await reg.register(tokenAddrsFT[1]);

}