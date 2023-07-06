const lib = artifacts.require("alt_bn128");
const NISA = artifacts.require("NISA");

module.exports = async function(deployer){
  // deployment steps
  await deployer.deploy(lib);
  await deployer.link(lib, NISA);
  await deployer.deploy(NISA);
};