const Web3 = require("web3");
const lib = require("./lib.js");
const rand = lib.rand;
const decoder = require("./decoder.js");
const webRTC = require("./webRTC.js");
const PPArt = require("../../build/contracts/PubParam.json");
const Mixer = require("../../build/contracts/Mixer.json");
const MFArt = require("../../build/contracts/MixerFactory.json");
const SoKab = require("../../build/contracts/SoKab.json");
const SoKba = require("../../build/contracts/SoKba.json");
const NFTArt = require("../../build/contracts/TokenNFT.json");
const FTArt = require("../../build/contracts/TokenFT.json");
const NFTFArt = require("../../build/contracts/NFTFactory.json");
const FTFArt = require("../../build/contracts/FTFactory.json");
const TokenReg = require("../../build/contracts/TokenRegistrar.json");

var web3, pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y;
var valx, valy, T1, T2, T3, Tmax, s;
var account, user, tktype, gasPrice;
var ci = false;

var attrP_By, P_By, attrP_Bx;
var attrP_Ax, P_Ax, attrP_Ay;

var E_Bx, attrR_By;
var E_Ay, attrR_Ax;
var attrE;

var beta, pky, tcomE_Ay, ocomE_Bx, R_By, sig_ba;
var setupBsucc = false;

var alpha, pkx, tcomE_Bx, ocomE_Ay, R_Ax, sig_ab;
var setupAsucc = false;
const ring_size = 16;

var tknames = {
  "A" : "",
  "B" : "",
  "X" : "",
  "Y" : ""
};

const set_user = (_u) => {
  user = _u;
}

const set_tkty = (_t) => {
  tktype = _t;
}

const set_s = (_s) => {
  s = _s;
}

const setup = async (mnid, pnid, baseNid) => {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    web3 = new Web3(window.ethereum);
  } else {
    alert ("Please install Metamask");
    return;
  }

  decoder.set_web3(web3);
  decoder.addABI(Mixer.abi);

  const xnid = (user == 'A')? mnid : pnid;
  const ynid = (user == 'A')? pnid : mnid;

  gasPrice = await web3.eth.getGasPrice();
  // change to base chain 
  pp = new web3.eth.Contract(PPArt.abi, PPArt.networks[baseNid].address);
  ba = new web3.eth.Contract(SoKba.abi, SoKba.networks[mnid].address);
  ab = new web3.eth.Contract(SoKab.abi, SoKab.networks[mnid].address);
  if (mnid == pnid){
    const mixerFactory = new web3.eth.Contract(MFArt.abi, MFArt.networks[baseNid].address);
    const mixerAddrs = await mixerFactory.methods.getMixers().call();
    mixerX = new web3.eth.Contract(Mixer.abi, mixerAddrs[0]);
    mixerY = new web3.eth.Contract(Mixer.abi, mixerAddrs[1]);
  } else {
    mixerX = new web3.eth.Contract(Mixer.abi, Mixer.networks[xnid].address);
    mixerY = new web3.eth.Contract(Mixer.abi, Mixer.networks[ynid].address);
  }
  var tokenAddrs;
  const FactArt = tktype == "ERC20" ? FTFArt : NFTFArt;
  const TokenArt = tktype == "ERC20" ? FTArt : NFTArt;
  if (mnid == pnid) {
    const Fact = new web3.eth.Contract(FactArt.abi, FactArt.networks[xnid].address);
    tokenAddrs = await Fact.methods.getTokens().call();
    x = new web3.eth.Contract(TokenArt.abi, tokenAddrs[0]);
    y = new web3.eth.Contract(TokenArt.abi, tokenAddrs[1]);
  } else {
    x = new web3.eth.Contract(TokenArt.abi, TokenArt.networks[xnid].address);
    y = new web3.eth.Contract(TokenArt.abi, TokenArt.networks[ynid].address);
    tokenAddrs = [x.options.address, y.options.address];
  }

  reg = new web3.eth.Contract(TokenReg.abi, TokenReg.networks[baseNid].address);

  ty_x = BigInt(await reg.methods.getTy(tokenAddrs[0]).call());
  ty_y = BigInt(await reg.methods.getTy(tokenAddrs[1]).call());

  tknames["A"] = await x.methods.name().call();
  tknames["B"] = await y.methods.name().call();
  tknames["X"] = await x.methods.name().call();
  tknames["Y"] = await y.methods.name().call();

  // const {set_up} = require("../index.js");
  // await set_up(mixerX, mixerY, x, y);

  return [mixerX, mixerY, x, y];
}

const connectWallet = async () => {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" })
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
  } catch(err) {
    alert(err.message);
    return;
  }
  const btn = document.getElementById('connect');

  const acc = lib.createElementFromString(
    "<b class='is-pulled-right'>Account: " + account + "</b>"
  );
  btn.nextElementSibling.replaceWith(acc);

  lib.actlog(`User ${lib.username[user]} connected to wallet at address ${account}`);
}

const inputHandler = async (b) => {
  if (account == null) { 
    alert("Please connect wallet"); 
    return; 
  }
  var inputs = [];
  for (const id of lib.inputpars[tktype]){
    const m = require("../index.js").get_mci(id);
    const p = require("./webRTC.js").get_pci(id);
    if (m != p || m == null) {
      alert("Please match with your partner");
      return;
    }
    inputs.push(m);
  }

  if (tktype == "ERC721") {
    [valx, valy, T1, T2, T3, Tmax] = inputs;
  } else  {
    valx = valy = 1;
    [T1, T2, T3, Tmax] = inputs;
  }

  if (T1 >= T2 || T2 >= T3 || T3 >= Tmax) {
    alert("Please input valid transaction times");
    return;
  }

  ci = true;

  b.onclick = null;
  b.innerHTML = "<b>Submitted!</b>";
  b.classList.add("is-success");
  lib.actlog(`User ${lib.username[user]} submitted common inputs: valx: ${valx}, valy: ${valy}, T1: ${T1}, T2: ${T2}, T3: ${T3}, Tmax: ${Tmax}, s: ${s}
  `);
}

const mint = async () => {
  if (ci == false) {
    alert("Please submit transaction times"); 
    return;
  }

  const valtk = user == 'A'? valx : valy;
  const tk = user == 'A'? x : y;

  const val = document.getElementById('mtinput').value;
  if (BigInt(val) != valtk && tktype == "ERC721") { 
    alert("Please input correct value"); 
    return; 
  }

  try {
    const tx = await tk.methods.mint(account, valtk).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Mint:`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }

  alert("Minting successful");
  lib.actlog(`User ${lib.username[user]} initiated Mint action: <br> minted value ${valtk} of token ${tknames[user]}`);

  if (tktype == "ERC20") {
    displaytk(tk, tknames[user], valtk);
  }
}

const displaytk = async (tk, name, valtk) => {
  try {
    const options = tktype == "ERC20" ? {
      address : tk.options.address,
      symbol : name.toUpperCase(),
      decimals : 18,
      image : "../images/dapp-icon2.png"
    } :
    {
      address : tk.options.address,
      tokenId : valtk
    };
    
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: tktype,
        options: options
      },
    });
  
    if (wasAdded) {
      alert("Token added on Metamask");
    }
  } catch (err) {
    alert(err.msg);
    return;
  }
}

const approve = async () => {
  if (ci == false) {
    alert("Please submit transaction times"); 
    return;
  }
  const addr = document.getElementById('approveaddr').value.trim();
  const ty = document.getElementById('approvety').value.trim();

  const valtk = user == 'A'? valx : valy;
  const mixer = user == 'A'? mixerX : mixerY;
  const tk = user == 'A'? x : y;

  if (BigInt(ty) != valtk || addr != mixer.options.address) {
    alert("Please input correct value");
    return;
  }
  try {
    const tx = await tk.methods.approve(mixer.options.address, valtk).send({from : account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Approve:`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }
  alert("Approve successful");
  lib.actlog(`User ${lib.username[user]} initiated Approve action: <br> approved account ${mixer.options.address} to have access to token ${tknames[user]} value ${valtk}`);
}

const checkBal = async (isX) => {
  const tk = isX? x : y;
  const name = isX? "X" : "Y";

  const input = document.getElementById(`bal-input-${name}`).value.trim();

  const baltag = document.getElementById(`bal-${name}`);

  const str = tktype == "ERC721"? "Owner" : "Balance";

  var output;


  try {
    if (tktype == "ERC721") {
      output = await tk.methods.ownerOf(input).call();
    } else {
      output = await tk.methods.balanceOf(input).call();
    }
  } catch(err) {
    baltag.innerHTML = `<b>${str}: </b>`;
    alert(err.message);
    return;
  }

  lib.actlog(`User ${lib.username[user]} initiated Check ${str} action at token ${tknames[name]}: checked ${str} of ${input} to be ${output}`)

  baltag.innerHTML = `<b>${str}: ${output}</b>`;
}


const deposit = async () => {
  const name = user == 'A'? "X" : "Y";
  const valtk = user == 'A'? valx : valy;
  const tytk = user == 'A'? ty_x : ty_y;
  const mixer = user == 'A'? mixerX : mixerY;

  const dpinput = document.getElementById(`dp-input-${name}`).value;
  if (BigInt(dpinput) != valtk) {
    alert("Please input correct value");
    return;
  }
  const attrP = [tytk, valtk, 0, Tmax, rand(), rand(), rand()];

  if (user == 'A') {
    attrP_Ax = attrP;
  } else {
    attrP_By = attrP;
  }

  const onetP = await pp.methods.onetAcc(attrP).call();
  const tx_dp = [onetP, attrP.slice(0,4)];
  const sig = await mixer.methods.deposit(tx_dp, attrP.slice(4)).call({
    from:account
  });

  try {
    const tx = await mixer.methods.process_dp(tx_dp, sig).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Deposit:`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }

  alert("Deposit successful");

  const P = await pp.methods.Com(attrP).call();
  if (user == 'A') {
    P_Ax = P;
  } else {
    P_By = P;
  }

  lib.actlog(`User ${lib.username[user]} initiated Deposit action: <br> deposited ${valtk} ${tknames[user]} to Mixer ${tknames[user].toUpperCase()}`);

  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${tknames[user].toUpperCase()}</b></p>`));
}

const withdraw = async (isX) => {
  var attrP, mixer, name, inputs, valtk, tk;
  if (user == 'A') {
    attrP = isX? attrP_Ax : attrP_Ay;
  } else {
    attrP = isX? attrP_Bx : attrP_By;
  }
  if (attrP == null) {
    alert("No P-account to withdraw");
    return;
  }
  name = isX? 'X' : 'Y';
  valtk = isX? valx : valy;
  tk = isX? x : y;
  inputs = document.getElementById(`wd-input-${name}`).value.split(',').map(x => x.trim());

  const P = await pp.methods.Com(attrP).call();

  if (inputs[0] != P.X || inputs[1] != P.Y) {
    alert("Please input correct P-account");
    return;
  }

  mixer = isX? mixerX : mixerY;

  const tag = await pp.methods.TagEval(attrP[4]).call();

  const R = Array.from(await mixer.methods.get_accs().call()).slice(0, ring_size);
  const theta = 4;
  R[theta] = P;

  const gs = R.slice(-Math.log2(ring_size));

  const tx_wd = [R, gs, tag, attrP.slice(0,4), account];

  const wit = [theta].concat(attrP.slice(4));

  const sig = await mixer.methods.withdraw(tx_wd, wit).call();

  try {
    const tx = await mixer.methods.process_wd(tx_wd, sig).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Mixer Process Deposit:`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }
  alert ("Withdraw successful");

  if (user == 'A') {
    if (isX) {attrP_Ax = null;} else {attrP_Ay = null;}
  } else {
    if (isX) {attrP_Bx = null;} else {attrP_By = null;}
  }

  lib.actlog(`User ${lib.username[user]} initiated Withdraw action: <br> withdrew token ${tknames[name]} id ${valtk} from Mixer ${tknames[name].toUpperCase()}`);

  const pacc = document.getElementById('pacc');
  pacc.lastChild.remove();

  if (tktype == "ERC20") {
    displaytk(tk, tknames[name], valtk);
  }
}

const setupB = async () => {
  if (ci == false) {
    alert("Please submit transaction times");
    return;
  }

  if (setupBsucc) {return;}

  beta = [rand(), rand(), rand(), rand()];

  pky = await pp.methods.TagKGen(beta[0]).call();

  attrE = [ty_y, valy, T2, T3, beta[0], beta[0]+s, beta[3]];

  tcomE_Ay = await pp.methods.tCom(attrE).call();

  ocomE_Bx = await pp.methods.oCom(attrE).call();

  attrR_By = [ty_y, valy, T3, Tmax, beta[0], beta[1], beta[2]];
  
  R_By = await pp.methods.Com(attrR_By).call();

  const c = [ty_y, valy, T2, T3, Tmax, s];
  const tx_ba = [c, pky, tcomE_Ay, ocomE_Bx, R_By];
  const wit = [parseInt(s)].concat(beta);

  sig_ba = await ba.methods.sign(tx_ba, wit).call();

  const encode = btoa(JSON.stringify([pky, tcomE_Ay, ocomE_Bx, R_By, sig_ba]));

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = null;
  setupBsucc = true;
  
  webRTC.send({
    type : "setup",
    data : encode
  })

  const sigbox = document.getElementById('sigbox');
  sigbox.appendChild(lib.createElementFromString(`<p> <b>Transmitted</b> </p>`));

  lib.actlog(`User ${lib.username[user]} transmitted setup signatures`);

  const racc = document.getElementById('racc');
  racc.appendChild(lib.createElementFromString(`<p>${R_By.X},<br>${R_By.Y}</p>`));

}

const setupA = async () => {
  if (ci == false) {
    alert("Please submit transaction times");
    return;
  }

  if (setupAsucc) {return;}

  alpha = [rand(), rand(), rand(), rand(), rand()];

  pkx = await pp.methods.TagKGen(alpha[0]).call();

  attrE = [ty_x, valx, T1, T2, alpha[0], alpha[1], alpha[2]];

  tcomE_Bx = await pp.methods.tCom(attrE).call();
  ocomE_Ay = await pp.methods.oCom(attrE).call();

  attrR_Ax = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];
  R_Ax = await pp.methods.Com(attrR_Ax).call();

  const c = [ty_x, valx, T1, T2, Tmax];
  const tx_ab = [c, pkx, tcomE_Bx, ocomE_Ay, R_Ax];
  const wit = alpha;

  sig_ab = await ab.methods.sign(tx_ab, wit).call();

  const encode = btoa(JSON.stringify([pkx, tcomE_Bx, ocomE_Ay, R_Ax, sig_ab]));

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = null;
  setupAsucc = true;

  webRTC.send({
    type : "setup",
    data : encode
  });
  const sigbox = document.getElementById('sigbox');
  sigbox.appendChild(lib.createElementFromString(`<p> <b>Transmitted</b></p>`));

  lib.actlog(`User ${lib.username[user]} transmitted setup signatures`); 

  const eacc = document.getElementById('eacc');
  E_Ay = await pp.methods.com([tcomE_Ay, [...ocomE_Ay]]).call();
  eacc.appendChild(lib.createElementFromString(`<p>${E_Ay.X},<br>${E_Ay.Y} <b>to check</b></p>`));

  const racc = document.getElementById('racc');
  racc.appendChild(lib.createElementFromString(`<p>${R_Ax.X},<br>${R_Ax.Y} </p>`));
}

const verify = async () => {

  const encode = webRTC.get_encode();

  if (encode == null) {
    alert("Please wait for your partner to transmit setup signatures");
    return;
  }

  const decode = JSON.parse(atob(encode));

  if (decode.length != 5) {
    alert("Verify failed");
    return;
  }

  if (user == "A") {
    [pky, tcomE_Ay, ocomE_Bx, R_By, sig_ba] = decode;
    const c = [ty_y, valy, T2, T3, Tmax, s];
    const tx_ba = [c, pky, tcomE_Ay, ocomE_Bx, R_By];
    const res = await ba.methods.verify(tx_ba, sig_ba).call();
    if (res == false) {
      alert("Verify failed");
      return;
    }
  } else {
    [pkx, tcomE_Bx, ocomE_Ay, R_Ax, sig_ab] = decode;
    const c = [ty_x, valx, T1, T2, Tmax];
    const tx_ab = [c, pkx, tcomE_Bx, ocomE_Ay, R_Ax];
    const res = await ab.methods.verify(tx_ab, sig_ab).call();
    if (res == false) {
      alert("Verify failed");
      return;
    }
    const eacc = document.getElementById('eacc');
    const arg = [tcomE_Bx, [...ocomE_Bx]];
    E_Bx = await pp.methods.com(arg).call();
    eacc.appendChild(lib.createElementFromString(`<p>${E_Bx.X},<br>${E_Bx.Y} <b>to check</b></p>`));
  }

  const verifybutton = document.getElementById('verifybutton');
  verifybutton.onclick = null;
  verifybutton.innerHTML = "<b>Verified!</b>";
  verifybutton.classList.add("is-success");

  lib.actlog(`User ${lib.username[user]} verified setup signatures`);
}

const preswap = async () => {
  const sks = user == 'A'? alpha : beta;

  if (sks == null) {
    alert("Please setup via webRTC first");
    return;
  } 

  const name = user == 'A'? "X" : "Y";
  const P = user == 'A'? P_Ax : P_By;
  const ps_input = document.getElementById(`ps-input-${name}`).value.split(',').map(x => x.trim());

  if (ps_input[0] != P.X || ps_input[1] != P.Y) {
    alert("Please input correct value");
    return;
  }

  const attrP = user == 'A'? attrP_Ax : attrP_By;
  const tstart = user == 'A'? T2 : T3;
  const opn = user == 'A'? alpha[3] : beta[1];
  const ok = user == 'A'? alpha[4] : beta[2];
  const pk = user == 'A'? pkx : pky;
  const attrR = user == 'A'? attrR_Ax : attrR_By;
  const tcomE = user == 'A'? tcomE_Bx : tcomE_Ay;
  const ocomE = user == 'A'? ocomE_Bx : ocomE_Ay;

  const tytk = user == 'A'? ty_x : ty_y;
  const valtk = user == 'A'? valx : valy;
  const mixer = user == 'A'? mixerX : mixerY;

  const R = Array.from(await mixer.methods.get_accs().call()).slice(0, ring_size);

  const theta = 4;
  R[theta] = P;

  const gs = R.slice(-Math.log2(ring_size));

  const tag = await pp.methods.TagEval(attrP[4]).call();

  const tcom_T = [tcomE, await pp.methods.tCom(attrR).call()];
  const ocom_T = [ocomE, await pp.methods.oCom(attrR).call()];

  const attrTs = [attrE.slice(2,4).concat([rand(), rand()]), [tstart, Tmax, opn, ok]];

  const tx_sp = [R, gs, tag, [attrP[5], BigInt(0), Tmax], pk, tcom_T, ocom_T];

  const wit = [theta, [tytk, valtk, attrP[4], attrP[6]], sks[0], attrTs];


  const sig = await mixer.methods.spend(tx_sp, wit).call();

  try {
    const tx = await mixer.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Mixer Process Spend (Preswap):`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }
  alert ("PreSwap successful");
  if (user == 'A') {
    attrP_Ax = null;
  } else {
    attrP_By = null;
  }

  lib.actlog(`User ${lib.username[user]} initiated PreSwap action: <br> PreSwap ${P.X}, ${P.Y} to Mixer ${tknames[user].toUpperCase()}}`);
  
  const pacc = document.getElementById('pacc');
  pacc.lastChild.remove();
}

const exchange = async () => {
  if (!isinChecked) {
    alert(`Please check if E-account is in Mixer ${tknames[user == "A" ? "Y" : "X"].toUpperCase()}`);
    return;
  }

  if (user == 'A' && !isinTag) {
    alert(`Please use your private key to check if tag is in Mixer ${tknames["Y"].toUpperCase()}`);
    return;
  }

  const sk = user == 'A' ? beta : alpha;

  if (sk == null) {
    if (user == 'A'){
      alert("Please submit your partner's private key");
    } else {
      alert("Please submit your partner's transaction hash to obtain his/her private key");
    }
    return;
  }

  const Eacc = user == 'A'? E_Ay : E_Bx;
  const name = user == 'A'? "Y" : "X";
  const inputs = document.getElementById(`ex-input-${name}`).value.split(",").map(elt => elt.trim());

  if (inputs[0] != Eacc.X || inputs[1] != Eacc.Y) {
    alert("Please input correct E-account");
    return;
  }

  const mixer = user == 'A'? mixerY : mixerX;
  const valtk = user == 'A'? valy : valx;
  const tytk = user == 'A'? ty_y : ty_x;
  const opn = user == 'A'? alpha[1] : beta[0]+s;
  const tstart = user == 'A'? T2 : T1;
  const tend = user == 'A'? T3 : T2;
  const ok = user == 'A'? alpha[2] : beta[3];

  const R = Array.from(await mixer.methods.get_accs().call()).slice(0, ring_size);
  const theta = 4;
  R[theta] = Eacc;
  const gs = R.slice(-Math.log2(ring_size));
  const tag = await pp.methods.TagEval(sk).call();

  const attrP = [tytk, valtk, tend, Tmax, rand(), rand(), rand()];

  const pkT = await pp.methods.TagKGen(attrP[4]).call();
  const tcom_T = [await pp.methods.tCom(attrP).call()];
  const ocom_T = [await pp.methods.oCom(attrP).call()];
  const attrTs = [[attrP[2], attrP[3], attrP[5], attrP[6]]];
  const tx_sp = [R, gs, tag, [opn, tstart, tend], pkT, tcom_T, ocom_T];

  const wit = [theta, [tytk, valtk, sk, ok], attrP[4], attrTs];

  const sig = await mixer.methods.spend(tx_sp, wit).call();

  try {
    const tx = await mixer.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Mixer Process Spend (Exchange):`, tx);
  } catch(err) {
    alert(err.message);
    return;
  }
  alert("Exchange successful");

  const P = await pp.methods.Com(attrP).call();
  if (user == 'A') {
    E_Ay = null;
    P_Ay = P;
    attrP_Ay = attrP;
  } else {
    E_Bx = null;
    P_Bx = P;
    attrP_Bx = attrP;
  }

  lib.actlog(`User ${lib.username[user]} initiated Exchange action: <br> exchanged ${Eacc.X}, ${Eacc.Y} to ${P.X}, ${P.Y}`);

  const eacc = document.getElementById('eacc');
  eacc.lastChild.remove();
  const racc = document.getElementById('racc');
  racc.lastChild.remove();

  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${tknames[name].toUpperCase()}</b></p>`));
}

const redeem = async (isX) => {
  const Racc = isX? R_Ax : R_By;
  if (Racc == null) {
    alert("Please setup with your partner first");
    // actually R should be in the pool
    return;
  }
  const name = isX? "X" : "Y";
  const inputs = document.getElementById(`rd-input-${name}`).value.split(",").map(elt => elt.trim());

  if (inputs[0] != Racc.X || inputs[1] != Racc.Y) {
    alert("Please input correct R-account");
    return;
  }
  const mixer = isX? mixerX : mixerY;
  
  const sk = isX? alpha[0] : beta[0];
  const Tstart = isX? T2 : T3;
  const valtk = isX? valx : valy;
  const tytk = isX? ty_x : ty_y;
  const opn = isX? alpha[3] : beta[1];
  const ok = isX? alpha[4] : beta[2];

  const R = Array.from(await mixer.methods.get_accs().call()).slice(0, ring_size);
  const theta = 4;
  const gs = R.slice(-Math.log2(ring_size));
  R[theta] = Racc;

  const tag = await pp.methods.TagEval(sk).call();
  const attrP = [tytk, valtk, Tstart, Tmax, rand(), rand(), rand()];

  const pkT = await pp.methods.TagKGen(attrP[4]).call();
  const tcom_T = [await pp.methods.tCom(attrP).call()];
  const ocom_T = [await pp.methods.oCom(attrP).call()];

  const attrTs = [[attrP[2], attrP[3], attrP[5], attrP[6]]];

  const tx_sp = [R, gs, tag, [opn, Tstart, Tmax], pkT, tcom_T, ocom_T];

  const wit = [theta, [tytk, valtk, sk, ok], attrP[4], attrTs];

  const sig = await mixer.methods.spend(tx_sp, wit).call();

  try {
    const tx = await mixer.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: gasPrice});
    lib.translog(`Mixer Process Spend (Redeem):`, tx);
  }
  catch(err) {
    alert(err.message);
    return;
  }
  alert("Redeem successful");

  if (isX) {
    R_Ax = null;
    attrP_Ax = attrP;
    P_Ax = P;
  } else {
    R_By = null;
    attrP_By = attrP;
    P_By = P;
  }

  lib.actlog(`User ${lib.username[user]} initiated Redeem action: <br> redeemed ${Racc.X}, ${Racc.Y} to ${P.X}, ${P.Y}`);

  const racc = document.getElementById('racc');
  racc.lastChild.remove();
  const eacc = document.getElementById('eacc');
  eacc.lastChild.remove();

  const pacc = document.getElementById('pacc');
  const P = await pp.methods.Com(attrP).call();
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${tknames[name].toUpperCase()}</b></p>`));
}

var isinChecked = false; // use in exchange

const isinAcc = async (isX) => {
  const mixer = isX? mixerX : mixerY;
  const name = isX? "X" : "Y";
  const inputs = document.getElementById(`isin-input-${name}`).value.split(",").map(elt => elt.trim());

  const Eacc = isX? E_Bx : E_Ay;

  if (inputs[0] != Eacc.X || inputs[1] != Eacc.Y) {
    alert("Please input correct E-account");
    return;
  }

  const bool = await mixer.methods.inAcc(Eacc).call();
  if (!bool) {
    alert("E-account not in pool, please redeem");
    return;
  }
  alert("E-account in pool, you may exchange");
  isinChecked = true;

  lib.actlog(`User ${lib.username[user]} checked that E-account ${Eacc.X}, ${Eacc.Y} is in Mixer ${tknames[name].toUpperCase()}`);
}

const sendskA = async () => {
  if (!isinChecked) {
    alert("Please check E-account is in Mixer");
    return;
  }
  webRTC.send({
    type : "alpha",
    data : alpha[0].toString()
  });

  const skkey = document.getElementById("skkey");
  skkey.innerHTML = `<p><b> Private Key: ${alpha[0]} Transmitted </b> </p>`;
}

var isinTag = false;

const isinTagA = async () => {
  const input = BigInt(document.getElementById('isintag-input-X').value.trim());

  if (BigInt(input) != alpha[0]) {
    alert("Please input correct private key");
    return;
  }

  const tag = await pp.methods.TagEval(alpha[0]).call();
  const bool = await mixerX.methods.inTag(tag).call();

  if (!bool) {
    alert("Tag not in pool, please redeem");
    return;
  }
  alert("Tag in pool, you may exchange");
  isinTag = true;

  lib.actlog(`User ${lib.username[user]} checked if tag corresponding to private key ${alpha[0]} is in Mixer ${tknames[user].toUpperCase()}`);

}

const checkAlphaB = async () => {

  const alpha_input = webRTC.get_alpha();

  if (alpha_input == null) {
    alert ("Please wait for your partner to transmit secret key");
    return;
  }

  const pk = await pp.methods.TagKGen(alpha_input).call();

  if (pk.X != pkx[0] || pk.Y != pkx[1]) {
    alert("Your partner's private key is false");
    return;
  }
  alpha = alpha_input;

  const alpha_button = document.getElementById('alpha-button');
  alpha_button.onclick = null;
  alpha_button.innerHTML = "<b>Verified!</b>";

  lib.actlog(`User ${lib.username[user]} checked that partner's private key is ${alpha_input}`);
}

const checkBetaA = async () => {
  const txhash = document.getElementById('txhash').value;
  const tx = await web3.eth.getTransaction(txhash);
  
  const decoded = decoder.decodeMethod(tx.input);

  const opn = decoded.params[0].value.attrS[0];

  const b = BigInt(opn) - s;

  const pk = await pp.methods.TagKGen(b).call();

  if (pk.X != pky[0] || pk.Y != pky[1]) {
    alert("Your partner's private key is false");
    return;
  }
  beta = b;
  alert ("Transaction validated, you may proceed to exchange");

  lib.actlog(`User ${lib.username[user]} checked that partner's private key is ${b}`);
}


module.exports = { 
  set_user, set_tkty, set_s,
  setup,
  connectWallet,
  inputHandler,
  mint, approve, checkBal,
  deposit, withdraw,
  setupB, setupA, verify,
  preswap, redeem, exchange,
  isinAcc, isinTagA, sendskA,
  checkAlphaB, checkBetaA
};