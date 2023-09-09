const TokenRegistrar = artifacts.require("TokenRegistrar");
const NFTFactory = artifacts.require("NFTFactory");

const overwritable = true;

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(NFTFactory, {overwrite: overwritable});

  /* Create NFTs x, y by Factory pattern */
  const nftf = await NFTFactory.deployed();
  await nftf.createNFT("x", "x");
  await nftf.createNFT("y", "y");
  const tokenAddrs = await nftf.getTokens();

  /* register token x and y */
  const reg = await TokenRegistrar.deployed();
  await reg.register(tokenAddrs[0]);
  await reg.register(tokenAddrs[1]);

}