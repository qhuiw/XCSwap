const lib = require("./lib.js");
const rand = lib.rand;
const assert = require("assert");
import Web3 from "web3";
const PPArt = require("../build/contracts/PubParam.json");
const Mixer = require("../build/contracts/Mixer.json");
const MFArt = require("../build/contracts/MixerFactory.json");
const SoKab = require("../build/contracts/SoKab.json");
const SoKba = require("../build/contracts/SoKba.json");
const NFTArt = require("../build/contracts/TokenNFT.json");
const NFTFArt = require("../build/contracts/NFTFactory.json");
const TokenReg = require("../build/contracts/TokenRegistrar.json");

/**
 * currently, create MixerX, Y, 
 * token X, Y, and register token X, Y upon deployment 
 * 
 */ 


/* state */
var web3 = null, account= null;
var user = null;
const ring_size = 16;

var pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y;
/* common inputs */
var ci=false, valx, valy, T1, T2, T3, Tmax, s;

var attrP_By, P_By, attrP_Bx;
var attrP_Ax, P_Ax, attrP_Ay;

const mintB = async () => {
  if (ci == false) {
    alert("Please submit common inputs"); 
    return;
  }

  const val = document.getElementById('mtinput').value;
  if (BigInt(val) != valy) { 
    alert("Please input correct value"); 
    return; 
  }

  try {
    await y.methods.mint(account, valy).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    console.log(err.message);
    alert(err.message);
  }
  
  const y_owner = await y.methods.ownerOf(valy).call();
  if (y_owner != account) {
    alert("Minting failed");
    return;
  } else {
    alert("Minting successful");
  }
}

const mintA = async () => {
  if (ci == false) {
    alert("Please submit common inputs");
    return;
  }

  const val = document.getElementById('mtinput').value;
  if (BigInt(val) != valx) { 
    alert("Please input correct value"); 
    return; 
  }

  try {
    await x.methods.mint(account, valx).send(
    {from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    console.log(err.message);
    alert(err.message);
  }

  const x_owner = await x.methods.ownerOf(valx).call();
  if (x_owner != account) {
    alert("Minting failed");
    return;
  }
  alert("Minting successful");
}

const approveA = async () => {
  const addr = document.getElementById('approveaddr').value;
  const ty = document.getElementById('approvety').value;
  if (BigInt(ty) != valx || addr != mixerX.options.address) {
    alert("Please input correct value");
    return;
  }
  try {
    await x.methods.approve(mixerX.options.address, valx).send({from : account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
  }
  alert("Approve successful");
}

const approveB = async () => {
  const addr = document.getElementById('approveaddr').value;
  const ty = document.getElementById('approvety').value;
  if (BigInt(ty) != valy || addr != mixerY.options.address) {
    alert("Please input correct value");
    return;
  }
  try {
    await y.methods.approve(mixerY.options.address, valy).send(
      {from : account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
  } 
  alert ("Approve successful")
}


const depositB = async () => {
  const dpinput = document.getElementById('dp-input-Y').value;
  if (BigInt(dpinput) != valy) {
    alert("Please input correct value");
  }

  attrP_By = [BigInt(ty_y), valy, 0, Tmax, rand(), rand(), rand()];
  const onetP_By = await pp.methods.onetAcc(attrP_By).call();

  const tx_dp = [onetP_By, attrP_By.slice(0,4)];

  const sig = await mixerY.methods.deposit(tx_dp, attrP_By.slice(4)).call();

  try {
    await mixerY.methods.process_dp(tx_dp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
  }

  const y_ownerAfter = await y.methods.ownerOf(valy).call();
  if (y_ownerAfter != mixerY.options.address) {
    alert("Deposit failed");
    return;
  } else {
    alert("Deposit successful");
  }

  P_By = await pp.methods.Com(attrP_By).call();
  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P_By.X},<br>${P_By.Y} <b>Minted</b></p>`));
}

const depositA = async () => {
  const dpinput = document.getElementById('dp-input-X').value;
  if (BigInt(dpinput) != valx) {
    alert("Please input correct value");
  }
  attrP_Ax = [ty_x, valx, 0, Tmax, rand(), rand(), rand()];
  const onetP_Ax = await pp.methods.onetAcc(attrP_Ax).call();

  const tx_dp = [onetP_Ax, attrP_Ax.slice(0,4)];

  const sig = await mixerX.methods.deposit(tx_dp, attrP_Ax.slice(4,7)).call();
  try {
    await mixerX.methods.process_dp(tx_dp, sig).send({
      from: account, gas: 6721975, gasPrice: 20000000000});
  } catch(err) {
    alert(err.message);
  }

  const x_ownerAfter = await x.methods.ownerOf(valx).call();
  if (x_ownerAfter != mixerX.options.address) {
    alert("Deposit failed");
    return;
  }

  P_Ax = await pp.methods.Com(attrP_Ax).call();
  const pacc = document.getElementById('pacc');
  pacc.appendChild(lib.createElementFromString(`<p>${P_Ax.X},<br>${P_Ax.Y} <b>Minted</b></p>`));
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

  // const P_By = await pp.methods.Com(attrP_By).call();

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
  }
  alert ("PreSwap successful");
}

const preswapA = async () => {


}

var beta = null, pky, tcomE_Ay, ocomE_Bx, R_By;
var setupBsucc = false;

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

var alpha=null, pkx, tcomE_Bx, ocomE_Ay, R_Ax;
var setupAsucc = false;

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
  const unmintedEacc = await pp.methods.com([[...tcomE_Ay], [...ocomE_Ay]]).call();
  eacc.appendChild(lib.createElementFromString(`<p>${unmintedEacc.X},<br>${unmintedEacc.Y} <b>to check</b></p>`));

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
    const unmintedEacc = await pp.methods.com(arg).call();
    eacc.appendChild(lib.createElementFromString(`<p>${unmintedEacc.X},<br>${unmintedEacc.Y} <b>to check</b></p>`));
  }

  const verifybutton = document.getElementById('verifybutton');
  verifybutton.onclick = null;
  verifybutton.innerHTML = "<b>Verified!</b>";
  verifybutton.classList.add("is-success");
}

const redeem = async () => {
  console.log("redeem");
}



const withdraw = async (isX) => {
  var attrP, mixer;
  if (user == 'A') {
    attrP = isX? attrP_Ax : attrP_Ay;
  } else {
    attrP = isX? attrP_Bx : attrP_By;
  }
  if (attrP == null) {
    alert("No P-account to withdraw");
    return;
  }

  mixer = isX? mixerX : mixerY;

  const P = await pp.methods.Com(attrP).call();
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
  }
  alert ("Withdraw successful");
  const pacc = document.getElementById('pacc');
  console.log(pacc.children);
  pacc.lastChild.remove();
}


const init = async (platform) =>{
  const page = document.getElementById('page');
  const newpage = lib.createElementFromString(
    `<div class="container" id="page2">
      <div class = "content" id="step1">
        <h4>1. Connect Metamask wallet to ${platform}</h4>
        <div class="field has-text-centered">
          <button class="button is-primary" id="connect">
            <b> Connect to Metamask </b> 
          </button>
        </div>
      </div>
      <div class = "content" id="step2">
        <h4>2. Common Inputs </h4>
        <div class = "box">
          <div class = "field has-addons">
            <input type="text" class="input" id="setup" placeholder="Enter valx, valy, T1, T2, T3, Tmax, s" multiple>
            <button class="button is-primary" id="ci"> 
            <b> Submit </b>  
            </button>
          </div>
        </div>
      </div>
      <div class = "content" id="step3">
        <h4>3. Mint your token </h4>
        <box class="box" id="mintbox">
          <h4> Token ${(user == 'A'? 'X' : 'Y')} </h4>
          <p> Address : ${user == 'A'? x.options.address : y.options.address} </p>
          <div class="field has-addons">
            <div class="control is-expanded">
              <input class="input" type="text" placeholder="Enter token value to mint (valx for A, valy for B)" id="mtinput">
            </div>
            <button class="button is-primary" id="mt">
            <b> Mint </b>
            </button>
          </div>

          <div class="field has-addons">
            <div class="control is-expanded">
              <input class="input" type="text" placeholder="Enter token value to approve (valx for A, valy for B)" id=approvety>
            </div>
            <div class="control is-expanded">
              <input class="input" type="text" placeholder="Enter approve address (Mixer X for A, Mixer Y for B)" id=approveaddr>
            </div>
            <button class="button is-primary" id="approve">
            <b> Approve </b>
            </button>
          </div>

        </box>
      </div>

      <div class="content mt-2">
        <h4> 6. Next Steps: XCSwap transactions </h4>
        <div class = "columns">
          <div class = "column">
            <div class = "box wrap" id="mixerX">
            <h4> Mixer X </h4>
            <p> Address : ${mixerX.options.address} </p>
            </div>
          </div>
          <div class = "column">
            <div class = "box wrap" id="mixerY">
            <h4> Mixer Y </h4>
            <p> Address : ${mixerY.options.address} </p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content mt-2">
        <h4> Your one-time accounts </h4>
      </div>
      <div class = "box">
        
        <div class="row" id="pacc">
          <p><b> P account: </b></p>
        </div>
        <div class="row" id="eacc">
          <p><b> E account: </b></p>
        </div>
        <div class="row" id="racc">
          <p><b> R account: </b></p>
        </div>
      </div>
      
    </div>
  `);  

  page.replaceWith(newpage);

  const step3 = document.getElementById('step3');
  const setupbutton = lib.createElementFromString(
    `<div class="box wrap" id="sigbox">
      <button class="button is-primary" id="setupbutton">
        <b> Send encoded commitments and signature to your partner: </b>
      </button>
    </div>`);
  const verifyfield = lib.createElementFromString(
    `<div class="box mb-5">
      <textarea class="textarea" placeholder="Paste your partner's encoded commitments and signature here" id="verify"></textarea>
      <br>
      <button class="button is-primary is-pulled-right" id="verifybutton">
        <b> Verify </b>
      </button> <br>
    </div>`);
  const createMixerfield = (isX) => {
    const name = isX ? "X" : "Y";
    const disabledBX = user == 'B' && isX ? "disabled" : "";
    const disabledBY = user == 'B' && !isX ? "disabled" : "";
    const disabledAX = user == 'A' && isX ? "disabled" : "";
    const disabledAY = user == 'A' && !isX ? "disabled" : "";
    const mixerfield = lib.createElementFromString(
      `<div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter token value to deposit" ${disabledBX + disabledAY} id="dp-input-${name}">
        </div>
        <button class="btn btn-primary" id="deposit-button-${name}" ${disabledBX + disabledAY}>
          Deposit
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter P-account to withdraw" id="wd-input-${name}">
        </div>
        <button class="btn btn-primary" id="withdraw-button-${name}">
          Withdraw
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter P-account for preswap" ${disabledBX + disabledAY} id="ps-input-${name}">
        </div>
        <button class="btn btn-primary" id="preswap-button-${name}" ${disabledBX + disabledAY}>
          PreSwap
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter E-account for exchange"  ${disabledBY + disabledAX} id="ex-input-${name}">
        </div>
        <button class="btn btn-primary" id="exchange-button-${name}" ${disabledBY + disabledAX}>
          Exchange
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter R-account for redeem" ${disabledBX + disabledAY} id="rd-input-${name}">
        </div>
        <button class="btn btn-primary" id="redeem-button-${name}" ${disabledBX + disabledAY}>
          Redeem
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter E-account for checking" ${disabledBY + disabledAX} id="wd-input-${name}">
        </div>
        <button class="btn btn-primary" id="isin-button-${name}" ${disabledBY + disabledAX}>
          CheckAccount
        </button>
      </div>
      </div>`);
      return mixerfield;
    }
  const mixerXbox = document.getElementById('mixerX');
  const mixerYbox = document.getElementById('mixerY');
  mixerXbox.appendChild(createMixerfield(true));
  mixerYbox.appendChild(createMixerfield(false));

  const dpX = document.getElementById('deposit-button-X');
  const dpY = document.getElementById('deposit-button-Y');
  dpX.onclick = depositA;
  dpY.onclick = depositB;
  const psX = document.getElementById('preswap-button-X');
  const psY = document.getElementById('preswap-button-Y');
  psX.onclick = preswapA;
  psY.onclick = preswapB;
  const wdX = document.getElementById('withdraw-button-X');
  const wdY = document.getElementById('withdraw-button-Y');
  wdX.onclick = withdraw.bind(null, true);
  wdY.onclick = withdraw.bind(null, false);

  var step4, step5;
  if (user == "B") {
    step4 = lib.createElementFromString(
      `<div class = "content" id="step4">
        <h4>4. Set up with your transaction partner </h4>
      </div>
      `);
    step5 = lib.createElementFromString(
      `<div class = "content" id="step5">
        <h4>5. Verify your partner's setup signature </h4>
      </div>
      `);
    setupbutton.onclick = setupB;
    step4.appendChild(setupbutton);
    step5.appendChild(verifyfield);
  } else {
    step4 = lib.createElementFromString(
      `<div class = "content" id="step4">
        <h4>4. Verify your partner's setup signature </h4>
      </div>
      `);
    step5 = lib.createElementFromString(
      `<div class = "content" id="step5">
        <h4>5. Set up with your transaction partner </h4>
      </div>
      `);
    step4.appendChild(verifyfield);
    setupbutton.onclick = setupA;
    step5.appendChild(setupbutton);
  }
  lib.insertAfter(step4, step3);
  lib.insertAfter(step5, step4);

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

  const connect = document.getElementById('connect');
  connect.onclick = connectWallet;

  const cibutton = document.getElementById('ci'); 
  cibutton.onclick = inputHandler.bind(null, cibutton);

  const mt = document.getElementById('mt');
  mt.onclick = user == "A" ? mintA : mintB;

  const approve = document.getElementById('approve');
  approve.onclick = user == "A" ? approveA : approveB;

  const vb = document.getElementById('verifybutton');
  vb.onclick = verify;
};



const main = async () => {
  const setup = async () => {
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
  }
  setup();


  var chains = [null,null];
  var nids = [null,null];
  var baseChain = null;

  const config = async (opt, idx) => {
    if (chains[idx] == opt.getAttribute("value")) {
      opt.classList.remove("has-background-success");
      chains[idx] = null;
      nids[idx] = null;
    } else if (chains[idx] == null) {
      opt.classList.add("has-background-success");
      chains[idx] = opt.getAttribute("value");
      nids[idx] = lib.net[chains[idx]];
    }
  }

  const pnets = document.getElementsByName('pnet');
  const mnets = document.getElementsByName('mnet');
  for (const pnet of pnets) {
    pnet.onclick = config.bind(null, pnet, 1);
  }
  for (const mnet of mnets) {
    mnet.onclick = config.bind(null, mnet, 0);
  }
  const roles = document.getElementsByName('r');
  for (const role of roles) {
    role.onclick = () => {
      user = role.value;
    }
  }
  const next = document.getElementById('next');
  next.onclick = () => {
    if (chains[0] == null || chains[1] == null || user == null) {
      alert("Please select all options");
      return;
    }
    init(chains[0]);
    baseChain = user == "A"? chains[0] : chains[1];
    next.style.visibility = "hidden";
    next.onclick = () => {
      if (ci == false) {
        alert("Please submit common inputs");
        return;
      }
    }
  }
}

export default main();