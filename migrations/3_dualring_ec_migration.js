const lib = artifacts.require("alt_bn128");
const nisa = artifacts.require("NISA");
const DualRingEC = artifacts.require("DualRingEC");

module.exports = async function (deployer) {
  await deployer.deploy(lib); 
  await deployer.link(lib, [nisa, DualRingEC]);

  await deployer.deploy(nisa);
  const _nisa = await nisa.deployed();

  await deployer.deploy(DualRingEC, _nisa.address);
  console.log("successful deploy DualRingEC")
};