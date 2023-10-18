const alt_bn128 = artifacts.require("alt_bn128");
const MixerFactory = artifacts.require("MixerFactory");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const PartEqual = artifacts.require("PartialEquality");
const DualRing = artifacts.require("DualRingEC");
const OneofMany = artifacts.require("OneofMany");
const DiffGenEqual = artifacts.require("DiffGenEqual");
const Sigma = artifacts.require("Sigma");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const SoKba = artifacts.require("SoKba");
const SoKab = artifacts.require("SoKab");
const PubParam = artifacts.require("PubParam");
const RelayRegistry = artifacts.require("RelayRegistry");
const Web3 = require("web3");

const overwritable = true;

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(alt_bn128, {overwrite: overwritable});

  await deployer.link(alt_bn128,
    [ Mixer, MixerFactory, PubParam,
      DualRing, PartEqual, DiffGenEqual, OneofMany, Sigma
    ]);

  await deployer.link(alt_bn128, [SoKdp, SoKwd, SoKsp, SoKab, SoKba]);



  await deployer.deploy(TokenRegistrar, {overwrite: overwritable});
  await deployer.deploy(RelayRegistry, {overwrite: overwritable});

  await deployer.deploy(PubParam, 1, {overwrite: overwritable});
  
  // const web3 = new Web3(new Web3.providers.HttpProvider("https://api.baobab.klaytn.net:8651"));
  // const pp = new web3.eth.Contract(PubParam.abi, PubParam.networks[1001].address);
  // const gs = await pp.methods.gs().call();
  // const g_pk = await pp.methods.g_pk().call();
  // const g_tag = await pp.methods.g_tag().call();
  // const h = await pp.methods.h().call();

  // const pp_here = await PubParam.deployed();
  // // const tx = await pp_here.set(gs, g_pk, g_tag, h);
  // // console.log("tx", tx);

  // const pp_here_gs = await pp_here.gs();

  // for (let i = 0; i < pp_here_gs.length; i++) {
  //   if (pp_here_gs[i].X != gs[i].X || pp_here_gs[i].Y != gs[i].Y) {
  //     console.log("pp_here_gs_i", pp_here_gs[i]);
  //     console.log("gs_i", gs[i]);
  //   }
  // }

}