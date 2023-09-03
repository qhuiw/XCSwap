const alt_bn128 = artifacts.require("alt_bn128");
const MixerFactory = artifacts.require("MixerFactory");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const NFTFactory = artifacts.require("NFTFactory");
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

const overwritable = true;

/* for same chain transaction */

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(MixerFactory, {overwrite: overwritable});
  await deployer.deploy(NFTFactory, {overwrite: overwritable});
  
  /* Create MixerX, Y */
  const mf = await MixerFactory.deployed();

  await deployer.deploy(Mixer, TokenRegistrar.address, PubParam.address, SoKdp.address, SoKwd.address, SoKsp.address, {overwrite: overwritable});
  const mixerX = await Mixer.deployed();
  await mf.addMixer(mixerX.address);

  await deployer.deploy(Mixer, TokenRegistrar.address, PubParam.address, SoKdp.address, SoKwd.address, SoKsp.address, {overwrite: overwritable});
  const mixerY = await Mixer.deployed();
  await mf.addMixer(mixerY.address);


  /* Create NFTs x, y by Factory pattern */
  const nftf = await NFTFactory.deployed();
  await nftf.createNFT("x", "x");
  await nftf.createNFT("y", "y");
  const tokenAddrs = await nftf.getTokens();

  /* register token x and y */
  const reg = await TokenRegistrar.deployed();
  await reg.register(tokenAddrs[0]);
  await reg.register(tokenAddrs[1]);

}