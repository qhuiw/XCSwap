const alt_bn128 = artifacts.require("alt_bn128");
const nisa2 = artifacts.require("NISA2");

module.exports = async function(deployer){
  // deployment steps
  await deployer.deploy(alt_bn128);
  await deployer.link(alt_bn128, nisa2);
  await deployer.deploy(nisa2);

};