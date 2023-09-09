const alt_bn128 = artifacts.require("alt_bn128");
const DualRing = artifacts.require("DualRingEC");
const OneofMany = artifacts.require("OneofMany");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const Sigma = artifacts.require("Sigma");

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