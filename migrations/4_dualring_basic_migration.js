const DualRing = artifacts.require("DualRing");
const alt_bn128 = artifacts.require("alt_bn128");

module.exports = function (deployer) {
  deployer.deploy(alt_bn128); 
  deployer.link(alt_bn128, DualRing);
  deployer.deploy(DualRing);
};