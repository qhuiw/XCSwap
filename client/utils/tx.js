const lib = require("./lib.js");
const decoder = require("./decoder.js");
const rand = lib.rand;
import Web3 from "web3";
const PPArt = require("../../build/contracts/PubParam.json");
const Mixer = require("../../build/contracts/Mixer.json");
const MFArt = require("../../build/contracts/MixerFactory.json");
const SoKab = require("../../build/contracts/SoKab.json");
const SoKba = require("../../build/contracts/SoKba.json");
const NFTArt = require("../../build/contracts/TokenNFT.json");
const NFTFArt = require("../../build/contracts/NFTFactory.json");
const TokenReg = require("../../build/contracts/TokenRegistrar.json");


var web3, pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y;
var valx, valy, T1, T2, T3, Tmax, s;
var account, user;
var ci = false;

var attrP_By, P_By, attrP_Bx;
var attrP_Ax, P_Ax, attrP_Ay;

var E_Bx;
var E_Ay;

var beta, pky, tcomE_Ay, ocomE_Bx, R_By;
var setupBsucc = false;

var alpha, pkx, tcomE_Bx, ocomE_Ay, R_Ax;
var setupAsucc = false;
const ring_size = 16;


const set_user = (u) => {
  user = u;
}

const setup = async (window) => {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    try{
      web3 = new Web3(window.ethereum);
    } catch(err) {
      alert("Please install metamask");
    }
  }

  // change to base chain 
  pp = new web3.eth.Contract(PPArt.abi, PPArt.networks[5777].address);
  ba = new web3.eth.Contract(SoKba.abi, SoKba.networks[5777].address);
  ab = new web3.eth.Contract(SoKab.abi, SoKab.networks[5777].address);
  const mixerFactory = new web3.eth.Contract(MFArt.abi, MFArt.networks[5777].address);
  const mixerAddrs = await mixerFactory.methods.getMixers().call();
  mixerX = new web3.eth.Contract(Mixer.abi, mixerAddrs[0]);
  mixerY = new web3.eth.Contract(Mixer.abi, mixerAddrs[1]);

  const NFTFactory = new web3.eth.Contract(NFTFArt.abi, NFTFArt.networks[5777].address);
  const tokenAddrs = await NFTFactory.methods.getTokens().call();
  x = new web3.eth.Contract(NFTArt.abi, tokenAddrs[0]);
  y = new web3.eth.Contract(NFTArt.abi, tokenAddrs[1]);

  reg = new web3.eth.Contract(TokenReg.abi, TokenReg.networks[5777].address);

  ty_x = BigInt(await reg.methods.getTy(tokenAddrs[0]).call());
  ty_y = BigInt(await reg.methods.getTy(tokenAddrs[1]).call());

  return [web3, pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y];
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
  btn.onclick = null;
  btn.innerHTML = "<b>You are Connected!</b>";
  btn.classList.add("is-success");
  const acc = lib.createElementFromString(
    "<p class='is-pulled-right'>Account: " + account + "</p>"
  );
  lib.insertAfter(acc, btn);
}

const inputHandler = async (b) => {
  if (account == null) { alert("Please connect wallet"); return; }
  const inputs = document.getElementById('setup').value.split(",").map(element => BigInt(element));
  if (inputs.length != 7) {
    alert("Please input 7 values");
    return;
  }
  [valx, valy, T1, T2, T3, Tmax, s] = inputs;
  ci = true;

  b.onclick = null;
  b.innerHTML = "<b>Submitted!</b>";
  b.classList.add("is-success");
}



const mint = async () => {
  if (ci == false) {
    alert("Please submit common inputs"); 
    return;
  }

  const valtk = user == 'A'? valx : valy;
  const tk = user == 'A'? x : y;

  const val = document.getElementById('mtinput').value;
  if (BigInt(val) != valtk) { 
    alert("Please input correct value"); 
    return; 
  }

  try {
    await tk.methods.mint(account, valtk).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }
  
  const tk_owner = await tk.methods.ownerOf(valtk).call();
  if (tk_owner != account) {
    alert("Minting failed");
    return;
  }
  alert("Minting successful");
}

const approve = async () => {
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
    await tk.methods.approve(mixer.options.address, valtk).send({from : account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }
  alert("Approve successful");
}


const deposit = async () => {
  const name = user == 'A'? "X" : "Y";
  const valtk = user == 'A'? valx : valy;
  const tytk = user == 'A'? ty_x : ty_y;
  const mixer = user == 'A'? mixerX : mixerY;
  const tk = user == 'A'? x : y;

  const dpinput = document.getElementById(`dp-input-${name}`).value;
  if (BigInt(dpinput) != valtk) {
    alert("Please input correct value");
  }
  const attrP = [tytk, valtk, 0, Tmax, rand(), rand(), rand()];

  if (user == 'A') {
    attrP_Ax = attrP;
  } else {
    attrP_By = attrP;
  }

  const onetP = await pp.methods.onetAcc(attrP).call();

  const tx_dp = [onetP, attrP.slice(0,4)];

  const sig = await mixer.methods.deposit(tx_dp, attrP.slice(4)).call();

  try {
    await mixer.methods.process_dp(tx_dp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }

  const tk_ownerAfter = await tk.methods.ownerOf(valtk).call();
  if (tk_ownerAfter != mixer.options.address) {
    alert("Deposit failed");
    return;
  }
  alert("Deposit successful");

  const P = await pp.methods.Com(attrP).call();
  if (user == 'A') {
    P_Ax = P;
  } else {
    P_By = P;
  }
  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${name}</b></p>`));
}

const withdraw = async (isX) => {
  var attrP, mixer, name, inputs;
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
    await mixer.methods.process_wd(tx_wd, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }
  alert ("Withdraw successful");
  const pacc = document.getElementById('pacc');
  pacc.lastChild.remove();

  if (user == 'A') {
    if (isX) {attrP_Ax = null;} else {attrP_Ay = null;}
  } else {
    if (isX) {attrP_Bx = null;} else {attrP_By = null;}
  }
}

const setupB = async () => {
  if (ci == false) {
    alert("Please submit common inputs");
    return;
  }

  if (setupBsucc) {return;}

  beta = [rand(), rand(), rand(), rand()];

  pky = await pp.methods.TagKGen(beta[0]).call();

  const attrE = [ty_y, valy, T2, T3, beta[0], beta[0]+s, beta[3]];

  tcomE_Ay = await pp.methods.tCom(attrE).call();

  ocomE_Bx = await pp.methods.oCom(attrE).call();

  const attrR_By = [ty_y, valy, T3, Tmax, beta[0], beta[1], beta[2]];
  
  R_By = await pp.methods.Com(attrR_By).call();

  const c = [ty_y, valy, T2, T3, Tmax, s];
  const tx_ba = [c, pky, tcomE_Ay, ocomE_Bx, R_By];
  const wit = [parseInt(s)].concat(beta);

  const sig_ba = await ba.methods.sign(tx_ba, wit).call();

  const encode = btoa(JSON.stringify([pky, tcomE_Ay, ocomE_Bx, R_By, sig_ba]));

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = null;
  setupBsucc = true;
  
  const sigbox = document.getElementById('sigbox');
  sigbox.appendChild(lib.createElementFromString(`<p>${encode}</p>`));

  const racc = document.getElementById('racc');
  racc.appendChild(lib.createElementFromString(`<p>${R_By.X},<br>${R_By.Y}</p>`));

}

const setupA = async () => {
  if (ci == false) {
    alert("Please submit common inputs");
    return;
  }

  if (setupAsucc) {return;}

  alpha = [rand(), rand(), rand(), rand(), rand()];

  pkx = await pp.methods.TagKGen(alpha[0]).call();

  const attrE = [ty_x, valx, T1, T2, alpha[0], alpha[1], alpha[2]];

  tcomE_Bx = await pp.methods.tCom(attrE).call();
  ocomE_Ay = await pp.methods.oCom(attrE).call();

  const attrR_Ax = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];
  R_Ax = await pp.methods.Com(attrR_Ax).call();

  const c = [ty_x, valx, T1, T2, Tmax];
  const tx_ab = [c, pkx, tcomE_Bx, ocomE_Ay, R_Ax];
  const wit = alpha;

  const sig_ab = await ab.methods.sign(tx_ab, wit).call();

  const encode = btoa(JSON.stringify([pkx, tcomE_Bx, ocomE_Ay, R_Ax, sig_ab]));

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = null;
  setupAsucc = true;

  const sigbox = document.getElementById('sigbox');
  sigbox.appendChild(lib.createElementFromString(`<p>${encode}</p>`));

  const eacc = document.getElementById('eacc');
  E_Ay = await pp.methods.com([tcomE_Ay, [...ocomE_Ay]]).call();
  eacc.appendChild(lib.createElementFromString(`<p>${E_Ay.X},<br>${E_Ay.Y} <b>to check</b></p>`));

  const racc = document.getElementById('racc');
  racc.appendChild(lib.createElementFromString(`<p>${R_Ax.X},<br>${R_Ax.Y} </p>`));
}

const verify = async () => {
  const encode = document.getElementById('verify').value;
  const decode = JSON.parse(atob(encode));

  if (decode.length != 5) {
    alert("Verify failed");
    return;
  }

  if (user == "A") {
    var sig_ba;
    [pky, tcomE_Ay, ocomE_Bx, R_By, sig_ba] = decode;
    const c = [ty_y, valy, T2, T3, Tmax, s];
    const tx_ba = [c, pky, tcomE_Ay, ocomE_Bx, R_By];
    const res = await ba.methods.verify(tx_ba, sig_ba).call();
    if (res == false) {
      alert("Verify failed");
      return;
    }
  } else {
    var sig_ab;
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
}

const preswapB = async () => {
  if (beta == null) {
    alert("Please setup with your partner first");
  }

  const attrE = [ty_y, valy, T2, T3, beta[0], beta[0]+s, beta[3]];
  const attrR_By = [ty_y, valy, T3, Tmax, beta[0], beta[1], beta[2]];

  const ps_input = document.getElementById('ps-input-Y').value.split(',').map(x => x.trim());

  if (ps_input[0] != P_By.X || ps_input[1] != P_By.Y) {
    alert("Please input correct value");
    return;
  }

  const R = Array.from(await mixerY.methods.get_accs().call()).slice(0, ring_size);

  const theta = 4;
  R[theta] = P_By;

  const gs = R.slice(-Math.log2(ring_size));

  const tagy = await pp.methods.TagEval(attrP_By[4]).call();

  const tcom_T = [tcomE_Ay, await pp.methods.tCom(attrR_By).call()];
  const ocom_T = [ocomE_Ay, await pp.methods.oCom(attrR_By).call()];

  const attrTs = [attrE.slice(2,4).concat([rand(), rand()]), [T3, Tmax, beta[1], beta[2]]];

  const tx_sp = [R, gs, tagy, [attrP_By[5], BigInt(0), Tmax], pky,  tcom_T, ocom_T];

  const wit = [theta, [ty_y, valy, attrP_By[4], attrP_By[6]], beta[0], attrTs];

  const sig = await mixerY.methods.spend(tx_sp, wit).call();

  try {
    await mixerY.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }
  alert ("PreSwap successful");
  attrP_By = null;
  const pacc = document.getElementById('pacc');
  pacc.lastChild.remove();
}

const preswapA = async () => {
  if (alpha == null) {
    alert("Please setup with your partner first");
  }

  const attrE = [ty_x, valx, T1, T2, alpha[0], alpha[1], alpha[2]];
  const attrR_Ax = [ty_x, valx, T2, Tmax, alpha[0], alpha[3], alpha[4]];

  const ps_input = document.getElementById('ps-input-X').value.split(',').map(x => x.trim());

  if (ps_input[0] != P_Ax.X || ps_input[1] != P_Ax.Y) {
    alert("Please input correct value");
    return;
  }

  const R = Array.from(await mixerX.methods.get_accs().call()).slice(0, ring_size);

  const theta = 4;
  R[theta] = P_Ax;

  const gs = R.slice(-Math.log2(ring_size));

  const tagx = await pp.methods.TagEval(attrP_Ax[4]).call();

  const tcom_T = [tcomE_Bx, await pp.methods.tCom(attrR_Ax).call()];
  const ocom_T = [ocomE_Bx, await pp.methods.oCom(attrR_Ax).call()];

  const attrTs = [attrE.slice(2,4).concat([rand(), rand()]), [T2, Tmax, alpha[3], alpha[4]]];

  const tx_sp = [R, gs, tagx, [attrP_Ax[5], BigInt(0), Tmax], pkx,  tcom_T, ocom_T];

  const wit = [theta, [ty_x, valx, attrP_Ax[4], attrP_Ax[6]], alpha[0], attrTs];

  const sig = await mixerX.methods.spend(tx_sp, wit).call();

  try {
    await mixerX.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
    return;
  }
  alert ("PreSwap successful");
  attrP_Ax = null;

  const pacc = document.getElementById('pacc');
  pacc.lastChild.remove();
}

const exchange = async () => {
  if (!isinChecked) {
    alert("Please check if E-account is in pool");
    return;
  }

  if (user == 'A' && !isinTag) {
    alert("Please use your private key to check if tag is in pool");
    return;
  }

  const sk = user == 'A' ? beta : alpha;

  if (sk == null) {
    alert("Please submit your partner's private key");
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
    await mixer.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
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

  const eacc = document.getElementById('eacc');
  eacc.lastChild.remove();
  const racc = document.getElementById('racc');
  racc.lastChild.remove();

  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${name}</b></p>`));
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
    await mixer.methods.process_sp(tx_sp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  }
  catch(err) {
    alert(err.message);
    return;
  }
  alert("Redeem successful");
  const racc = document.getElementById('racc');
  racc.lastChild.remove();
  const eacc = document.getElementById('eacc');
  eacc.lastChild.remove();

  const pacc = document.getElementById('pacc');
  const P = await pp.methods.Com(attrP).call();
  pacc.appendChild(lib.createElementFromString(`<p>${P.X},<br>${P.Y} <b>Mixer ${name}</b></p>`));  

  if (isX) {
    R_Ax = null;
    attrP_Ax = attrP;
    P_Ax = P;
  } else {
    R_By = null;
    attrP_By = attrP;
    P_By = P;
  }
}

var isinChecked = false; // use in exchange

const isin = async (isX) => {
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

  if (user == 'A') {
    const skbox = document.getElementById('skbox');
    const sk = lib.createElementFromString(`<p><b> Private key: </b> ${alpha[0]}</p>`);
    skbox.insertBefore(sk, skbox.lastChild);
  }
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
}

const checkAlphaB = async () => {
  const alpha_input = BigInt(document.getElementById('alpha-input').value.trim());

  const pk = await pp.methods.TagKGen(alpha_input).call();

  if (pk.X != pkx[0] || pk.Y != pkx[1]) {
    alert("Your partner's private key is false");
    return;
  }
  alpha = alpha_input;
  alert ("Successful");
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
  alert ("Successful");
}


module.exports = { 
  set_user, setup, 
  connectWallet,
  inputHandler,
  mint,
  approve,
  deposit,
  withdraw,
  setupB, setupA, verify,
  preswapB, preswapA,
  redeem, exchange,
  isin, isinTagA,
  checkAlphaB, checkBetaA
};