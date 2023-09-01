const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");

const overwritable = true;

const argv = process.argv.slice(2)[0].split(" ");

module.exports = async function(deployer, _, accounts){
  var nid;

  for (i = 0; i < argv.length; i++) {
    if (argv[i] == "--nid" && i+1 < argv.length) {
      nid = argv[i+1];
      break;
    }
  }

  const lib = await alt_bn128.at(alt_bn128.networks[nid].address);
  await deployer.link(lib, Mixer);

  const sokdp_addr = SoKdp.networks[nid].address;
  const sokwd_addr = SoKwd.networks[nid].address;
  const soksp_addr = SoKsp.networks[nid].address;
  const reg_addr = TokenRegistrar.networks[nid].address;
  
  /* Create Mixer */
  await deployer.deploy(Mixer, reg_addr, pp_addr, sokdp_addr, sokwd_addr, soksp_addr, {overwrite: overwritable});

  /* Create NFT x */
  await deployer.deploy(TokenNFT, "x", "x", {overwrite: overwritable});

  /* register token x */
  const reg = await TokenRegistrar.at(reg_addr);
  const x = await TokenNFT.deployed();
  await reg.register(x.address);
}