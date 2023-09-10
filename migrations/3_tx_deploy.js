const alt_bn128 = artifacts.require("alt_bn128");
const DualRing = artifacts.require("DualRingEC");
const OneofMany = artifacts.require("OneofMany");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const PartEqual = artifacts.require("PartialEquality");
const Sigma = artifacts.require("Sigma");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const SoKba = artifacts.require("SoKba");
const SoKab = artifacts.require("SoKab");
const PubParam = artifacts.require("PubParam");

const overwritable = true;

module.exports = async function(deployer, _, accounts){

  const nid = await web3.eth.net.getId();

  if (!alt_bn128.networks[nid]) {
    console.log("Migrate lib_deploy first");
    return;
  }

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

}