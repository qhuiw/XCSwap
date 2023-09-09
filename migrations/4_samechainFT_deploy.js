const TokenRegistrar = artifacts.require("TokenRegistrar");
const FTFactory = artifacts.require("FTFactory");

const overwritable = false;

/* for same chain transaction */

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(FTFactory, {overwrite: overwritable});

  /* Create FTs a, b by Factory pattern */
  const ftf = await FTFactory.deployed();
  await ftf.createFT("a", "a");
  await ftf.createFT("b", "b");
  const tokenAddrsFT = await ftf.getTokens();

  /* register token x and y */
  const reg = await TokenRegistrar.deployed();
  await reg.register(tokenAddrsFT[0]);
  await reg.register(tokenAddrsFT[1]);

}