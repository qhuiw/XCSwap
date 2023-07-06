const lib = artifacts.require("alt_bn128");
const NISA = artifacts.require("NISA");
const DualRingEC = artifacts.require("DualRingEC");

module.exports = function (deployer) {
  deployer.deploy(lib); 
  deployer.link(lib, NISA);

  deployer.deploy(NISA);
  deployer.link(lib, DualRingEC);
  deployer.link(NISA,DualRingEC);
  deployer.deploy(DualRingEC);
};