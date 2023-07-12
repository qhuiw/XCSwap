const lib = artifacts.require("alt_bn128");
const DualRing = artifacts.require("DualRing");

module.exports = function (deployer) {
  deployer.deploy(lib); 
  deployer.link(lib, DualRing);
  deployer.deploy(DualRing);
  // console.log("Migration: deploy DualRing");
};