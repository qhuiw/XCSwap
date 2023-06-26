const alt_bn128 = artifacts.require("alt_bn128");
const nisa = artifacts.require("NISA");

module.exports = async function(deployer){
  // deployment steps
  await deployer.deploy(alt_bn128);
  await deployer.link(alt_bn128, nisa);
  await deployer.deploy(nisa);

};