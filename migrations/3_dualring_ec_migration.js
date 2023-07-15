const lib = artifacts.require("alt_bn128");
const DualRingEC = artifacts.require("DualRingEC");

module.exports = async function (deployer) {
  await deployer.deploy(lib); 
  await deployer.link(lib, DualRingEC);
  await deployer.deploy(DualRingEC);
};