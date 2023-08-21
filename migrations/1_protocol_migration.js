const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const PartialEquality = artifacts.require("PartialEquality");
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
const {writeFile} = require('fs/promises');
const fs = require('fs');

module.exports = async function(deployer){
  // await deployer.deploy(lib);
  // await deployer.link(lib, 
  //   [ Mixer, PubParam, 
  //     DualRing, PartialEquality, DiffGenEqual, OneofMany, Sigma,
  //     SoKdp, SoKwd, SoKsp, SoKab, SoKba
  //   ]);

  // await deployer.deploy(PubParam, 1);


  // await deployer.deploy(TokenRegistrar);

  // var lib, pp, dr, pe, sg, om;
  // var dp, wd, sp, ba, ab;
  // var rg, x, y, ty_x, ty_y, mixerX, mixerY;

  const lib = await alt_bn128.new();
  await Mixer.link(lib);
  await PubParam.link(lib);

  await SoKdp.link(lib);
  await SoKwd.link(lib);
  await SoKsp.link(lib);
  await SoKba.link(lib);
  await SoKab.link(lib);

  await PartialEquality.link(lib);
  await DualRing.link(lib);
  await DiffGenEqual.link(lib);
  await Sigma.link(lib);
  await OneofMany.link(lib);

    /* 1 traded token */
  const pp = await PubParam.new(1); 
  const pe = await PartialEquality.new();
  const dr = await DualRing.new();
  const om = await OneofMany.new();
  const dg = await DiffGenEqual.new();
  const sg = await Sigma.new();

  console.log(pp.address)
  // deployer.deploy(PubParam, 1);

    /* set up */
  const ba = await SoKba.new(pp.address, pe.address, dg.address, sg.address);
  const ab = await SoKab.new(pp.address, pe.address, dg.address, sg.address);
  /* mixer */
  const dp = await SoKdp.new(pp.address, pe.address);
  const wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address, om.address);
  const sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address, om.address);

    /* token registrar */
  const rg = await TokenRegistrar.new();

  const mixerX = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
  console.log("mixerX", mixerX.address)
  const mixerY = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
  console.log("mixerY", mixerY.address)

    /*  initiate and register NFTs "x" & "y" */
  const x = await TokenNFT.new("x", "x");
  await rg.register(x.address);

  const y = await TokenNFT.new("y", "y");
  await rg.register(y.address);

  const addr = {
    "mixerX": mixerX.address,
    "mixerY": mixerY.address,
    "x": x.address,
    "y": y.address
  };

  fs.writeFileSync('/../tmp/config.json', JSON.stringify(addr), (err) => {
    if (err) throw err;
  });
  
};

// const deploy = async () => {
//   var lib, pp, dr, pe, sg, om;
//   var dp, wd, sp, ba, ab;
//   var rg, x, y, ty_x, ty_y, mixerX, mixerY;

//   lib = await alt_bn128.new();
//   await Mixer.link(lib);
//   await PubParam.link(lib);

//   await SoKdp.link(lib);
//   await SoKwd.link(lib);
//   await SoKsp.link(lib);
//   await SoKba.link(lib);
//   await SoKab.link(lib);

//   await PartialEquality.link(lib);
//   await DualRing.link(lib);
//   await DiffGenEqual.link(lib);
//   await Sigma.link(lib);
//   await OneofMany.link(lib);

//     /* 1 traded token */
//   pp = await PubParam.new(1); 
//   pe = await PartialEquality.new();
//   dr = await DualRing.new();
//   om = await OneofMany.new();
//   dg = await DiffGenEqual.new();
//   sg = await Sigma.new();

//   console.log(pp.address)
//   deployer.deploy(PubParam, 1);

//     /* set up */
//   ba = await SoKba.new(pp.address, pe.address, dg.address, sg.address);
//   ab = await SoKab.new(pp.address, pe.address, dg.address, sg.address);
//   /* mixer */
//   dp = await SoKdp.new(pp.address, pe.address);
//   wd = await SoKwd.new(pp.address, pe.address, dr.address, dg.address, om.address);
//   sp = await SoKsp.new(pp.address, pe.address, dr.address, dg.address, om.address);

//     /* token registrar */
//   rg = await TokenRegistrar.new();

//   mixerX = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
//   console.log("mixerX", mixerX.address)
//   mixerY = await Mixer.new(rg.address, pp.address, dp.address, wd.address, sp.address);
//   console.log("mixerY", mixerY.address)

//   /*  initiate and register NFTs "x" & "y" */
//   x = await TokenNFT.new("x", "x");
//   await rg.register(x.address);

//   y = await TokenNFT.new("y", "y");
//   await rg.register(y.address);

//   const addr = {
//     "mixerX": mixerX.address,
//     "mixerY": mixerY.address,
//     "x": x.address,
//     "y": y.address
//   };

//   const data = JSON.stringify(addr);

//   fs.writeFile('../config.txt', data, (err) => {
//     if (err) throw err;
//   });

// }

// deploy();