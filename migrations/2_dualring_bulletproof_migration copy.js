const DualRingBulletproof = artifacts.require("DualRingBulletproof");
const alt_bn128 = artifacts.require("alt_bn128");
const nisa = artifacts.require("NISA");

module.exports = function (deployer) {
  deployer.deploy(alt_bn128); 
  deployer.link(alt_bn128, nisa);

  deployer.deploy(nisa);
  deployer.link(alt_bn128, DualRingBulletproof);
  deployer.link( nisa,DualRingBulletproof);
  deployer.deploy(DualRingBulletproof);
};