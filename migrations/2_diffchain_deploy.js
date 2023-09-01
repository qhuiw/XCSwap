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

module.exports = async function(deployer, _, accounts){
  await deployer.deploy(alt_bn128, {overwrite: overwritable});

  await deployer.link(alt_bn128,
    [ Mixer, MixerFactory, PubParam,
      DualRing, PartEqual, DiffGenEqual, OneofMany, Sigma
    ]);

  await deployer.link(alt_bn128, [SoKdp, SoKwd, SoKsp, SoKab, SoKba]);

  await deployer.deploy(PubParam, 1, {overwrite: overwritable});

  await deployer.deploy(DualRing, {overwrite: overwritable});
  await deployer.deploy(PartEqual, {overwrite: overwritable}); 
  await deployer.deploy(DiffGenEqual, {overwrite: overwritable});
  await deployer.deploy(OneofMany, {overwrite: overwritable});
  await deployer.deploy(Sigma, {overwrite: overwritable});

  await deployer.deploy(
    SoKab, PubParam.address, PartEqual.address, DiffGenEqual.address, Sigma.address, {overwrite: overwritable});
  await deployer.deploy(
    SoKba, PubParam.address, PartEqual.address, DiffGenEqual.address, Sigma.address, {overwrite: overwritable});
  
  await deployer.deploy(
    SoKdp, PubParam.address, PartEqual.address, {overwrite: overwritable});
  await deployer.deploy(
    SoKwd, PubParam.address, PartEqual.address, DualRing.address, DiffGenEqual.address, OneofMany.address, {overwrite: overwritable});
  await deployer.deploy(
    SoKsp, PubParam.address, PartEqual.address, DualRing.address, DiffGenEqual.address, OneofMany.address, {overwrite: overwritable});

  await deployer.deploy(TokenRegistrar, {overwrite: overwritable});
  await deployer.deploy(RelayRegistry, {overwrite: overwritable});
}