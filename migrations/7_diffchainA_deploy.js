const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const TokenFT = artifacts.require("TokenFT");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");

const overwritable = false;

const argv = process.argv.slice(2)[0].split(" ");

module.exports = async function(deployer, _, accounts){
  const nid = await web3.eth.net.getId();

  if (!alt_bn128.networks[nid]){
    console.log("migrate lib_deploy first");
    return;
  }

  var baseNid;

  for (i = 0; i < argv.length; i++) {
    if (argv[i] == "--nid" && i+1 < argv.length) {
      baseNid = argv[i+1];
      break;
    }
  }

  const reg_addr = TokenRegistrar.networks[baseNid].address;
  
  /* Create Mixer */
  await deployer.deploy(Mixer, reg_addr, pp_addr, SoKdp.address, SoKwd.address, SoKsp.address);

  /* Create NFT x */
  await deployer.deploy(TokenNFT, "x", "x");

  /* Create FT */
  await deployer.deploy(TokenFT, "a", "a", {overwrite: overwritable});

  /* register token x */
  const reg = await TokenRegistrar.at(reg_addr);
  const x = await TokenNFT.deployed();
  const a = await TokenFT.deployed();
  await reg.register(x.address);
  await reg.register(a.address);
}