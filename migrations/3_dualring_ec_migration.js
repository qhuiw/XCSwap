const lib = artifacts.require("alt_bn128");
const nisa = artifacts.require("NISA");
const DualRingEC = artifacts.require("DualRingEC");

module.exports = async function (deployer) {
  await deployer.deploy(lib); 
  await deployer.link(lib, [nisa, DualRingEC]);

  await deployer.deploy(nisa);

  await deployer.deploy(DualRingEC, nisa.address);
  // console.log("Migration: deploy DualRingEC");
};