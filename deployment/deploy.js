const alt_bn128 = require("../build/contracts/alt_bn128.json");
const Mixer = require("../build/contracts/Mixer.json");
const TokenRegistrar = require("../build/contracts/TokenRegistrar.json");
const TokenNFT = require("../build/contracts/TokenNFT.json");
const PartialEquality = require("../build/contracts/PartialEquality.json");
const DualRing = require("../build/contracts/DualRingEC.json");
const OneofMany = require("../build/contracts/OneofMany.json");
const DiffGenEqual = require("../build/contracts/DiffGenEqual.json");
const Sigma = require("../build/contracts/Sigma.json");

const SoKdp = require("../build/contracts/SoKdp.json");
const SoKwd = require("../build/contracts/SoKwd.json");
const SoKsp = require("../build/contracts/SoKsp.json");
const SoKba = require("../build/contracts/SoKba.json");
const SoKab = require("../build/contracts/SoKab.json");
const PubParam = require("../build/contracts/PubParam.json");
const {Web3} = require("web3");
const fs = require('fs');

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545') || window.ethereum);

const main = async () => {
  console.log("Deploying contracts...");

  const accounts = await web3.eth.getAccounts();

  console.log("Account: ", accounts);

  const lib = await new web3.eth.Contract(alt_bn128.abi);
  const pp = await new web3.eth.Contract(PubParam.abi);
  const pe = await new web3.eth.Contract(PartialEquality.abi);
  const dr = await new web3.eth.Contract(DualRing.abi);
  const om = await new web3.eth.Contract(OneofMany.abi);
  const dg = await new web3.eth.Contract(DiffGenEqual.abi);
  const sg = await new web3.eth.Contract(Sigma.abi);

  const dp = await new web3.eth.Contract(SoKdp.abi);
  const wd = await new web3.eth.Contract(SoKwd.abi);
  const sp = await new web3.eth.Contract(SoKsp.abi);
  const ba = await new web3.eth.Contract(SoKba.abi);
  const ab = await new web3.eth.Contract(SoKab.abi);

  const mixer = await new web3.eth.Contract(Mixer.abi);

  const lib_ins = await lib.deploy({data: alt_bn128.bytecode}).send({from: accounts[0], gas: 6721975});
  console.log("Deployed lib: ", lib_ins.options.address);

  // const mixer_ins = await mixer.deploy({data: Mixer.bytecode}).send({from: accounts[0], gas: 6721975});

  const data = {
    "lib": lib_ins.options.address
  }

  fs.writeFileSync("config.json", JSON.stringify(data));

  // const lib2_ins = await lib.deploy({data: alt_bn128.bytecode}).send({from: accounts[0], gas: 6721975});
  // console.log("Deployed lib: ", lib2_ins.options.address);
}


main();


