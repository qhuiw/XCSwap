const lib = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartEqual = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const DiffGenEqual = artifacts.require("DiffGenEqual");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const PubParam = artifacts.require("PubParam");

module.exports = async function(deployer){
  // deployment steps
  await deployer.deploy(lib);
  await deployer.link(lib, 
    [Mixer, PubParam, SoKdp, SoKwd, SoKsp, PartEqual, DualRing, DiffGenEqual]);

  await deployer.deploy(PubParam, 1);
};