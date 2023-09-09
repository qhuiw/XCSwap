const MixerFactory = artifacts.require("MixerFactory");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");

const SoKdp = artifacts.require("SoKdp");
const SoKwd = artifacts.require("SoKwd");
const SoKsp = artifacts.require("SoKsp");
const PubParam = artifacts.require("PubParam");

const overwritable = true;

module.exports = async function(deployer, _, accounts){

  await deployer.deploy(MixerFactory, {overwrite: overwritable});
  
  /* Create MixerX, Y */
  const mf = await MixerFactory.deployed();

  await deployer.deploy(Mixer, TokenRegistrar.address, PubParam.address, SoKdp.address, SoKwd.address, SoKsp.address, {overwrite: overwritable});
  const mixerX = await Mixer.deployed();
  await mf.addMixer(mixerX.address);

  await deployer.deploy(Mixer, TokenRegistrar.address, PubParam.address, SoKdp.address, SoKwd.address, SoKsp.address, {overwrite: overwritable});
  const mixerY = await Mixer.deployed();
  await mf.addMixer(mixerY.address);

}