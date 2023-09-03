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

const overwritable = false;

module.exports = async function(deployer, _, accounts){

  const nid = await web3.eth.net.getId();

  if (!alt_bn128.networks[nid]) {
    console.log("Migrate lib_deploy first");
    return;
  }

  await deployer.deploy(DualRing, {overwrite: overwritable});
  await deployer.deploy(PartEqual, {overwrite: overwritable});
  await deployer.deploy(DiffGenEqual, {overwrite: overwritable});
  await deployer.deploy(OneofMany, {overwrite: overwritable});
  await deployer.deploy(Sigma, {overwrite: overwritable});

}