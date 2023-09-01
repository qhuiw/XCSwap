const lib = require("./utils/lib.js");
const tx = require("./utils/tx.js");
const decoder = require("./utils/decoder.js");
const Mixer = require("../build/contracts/Mixer.json");

/* state */
var web3, account;
var user;

var pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y;

/* new page */
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

      <div class="content mt-2" id="offchain">
        <h4> Private key Communication </h4>
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
  const setupfield = lib.createElementFromString(
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
          <input class="input" type="text" placeholder="Enter E-account for checking" ${disabledBY + disabledAX} id="isin-input-${name}">
        </div>
        <button class="btn btn-primary" id="isin-button-${name}" ${disabledBY + disabledAX}>
          CheckAcc
        </button>
      </div>
      <div class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" placeholder="Enter private key for checking" ${disabledBX + disabledBY + disabledAY} id="isintag-input-${name}">
        </div>
        <button class="btn btn-primary" id="isintag-button-${name}" ${disabledBX + disabledBY + disabledAY}>
          CheckTag
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
  dpX.onclick = tx.deposit;
  dpY.onclick = tx.deposit;
  const psX = document.getElementById('preswap-button-X');
  const psY = document.getElementById('preswap-button-Y');
  psX.onclick = tx.preswapA;
  psY.onclick = tx.preswapB;
  const wdX = document.getElementById('withdraw-button-X');
  const wdY = document.getElementById('withdraw-button-Y');
  wdX.onclick = tx.withdraw.bind(null, true);
  wdY.onclick = tx.withdraw.bind(null, false);
  const reX = document.getElementById('redeem-button-X');
  const reY = document.getElementById('redeem-button-Y');
  reX.onclick = tx.redeem.bind(null, true);
  reY.onclick = tx.redeem.bind(null, false);
  const exX = document.getElementById('exchange-button-X');
  const exY = document.getElementById('exchange-button-Y');
  exX.onclick = tx.exchange;
  exY.onclick = tx.exchange;

  const isinX = document.getElementById('isin-button-X');
  const isinY = document.getElementById('isin-button-Y');
  isinX.onclick = tx.isin.bind(null, true);
  isinY.onclick = tx.isin.bind(null, false);

  const isinTagX = document.getElementById('isintag-button-X');
  isinTagX.onclick = tx.isinTagA;

  const skcom = document.getElementById('offchain');
  var step4, step5, skbox;
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
    step4.appendChild(setupfield);
    step5.appendChild(verifyfield);
    skbox = lib.createElementFromString(
      `<div class="box" id="skbox">
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" type="text" placeholder="Enter your partner's private key" id="alpha-input">
          </div>
          <button class="btn btn-primary" id="alpha-button">
            Submit
          </button>
        </div>
      </div>`);
    skcom.appendChild(skbox);

    const alphabutton = document.getElementById('alpha-button');
    alphabutton.onclick = tx.checkAlphaB;
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
    step5.appendChild(setupfield);
    skbox = lib.createElementFromString(
      `<div class="box" id="skbox">
        <b> Send private key to your partner: </b>
        <br>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" type="text" placeholder="Enter B's exchange transaction hash" id="txhash">
          </div>
          <button class="btn btn-primary" id="txhash-button">
            <b>Submit</b>
          </button>
      </div>`);
    skcom.appendChild(skbox);

    const txhashbutton = document.getElementById('txhash-button');
    txhashbutton.onclick = tx.checkBetaA;
  }
  lib.insertAfter(step4, step3);
  lib.insertAfter(step5, step4);

  const connect = document.getElementById('connect');
  connect.onclick = tx.connectWallet;

  const cibutton = document.getElementById('ci'); 
  cibutton.onclick = tx.inputHandler.bind(null, cibutton);

  const mt = document.getElementById('mt');
  mt.onclick = tx.mint;

  const approvebtn = document.getElementById('approve');
  approvebtn.onclick = tx.approve;

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = (user == 'A')? tx.setupA : tx.setupB;

  const vb = document.getElementById('verifybutton');
  vb.onclick = tx.verify;
};

const main = async () => {

  var chains = [null,null];
  var nids = [null,null];
  var baseNid;

  const getOption = async (el, id) => {
    const network = el.value;
    const newimg = document.createElement("div");
    newimg.innerHTML = `<img src = "${lib.img[network]}" alt="${network}" border="0" style="width:50px;height:50px" id="${id}">`;
    document.getElementById(id).replaceWith(newimg.firstChild);
  }

  const pnet = document.getElementById("pnet");
  pnet.onchange=getOption.bind(null, pnet, 'pimg');
  const mnet = document.getElementById('mnet');
  mnet.onchange=getOption.bind(null, mnet, 'mimg');

  const roles = document.getElementsByName('r');
  for (const role of roles) {
    role.onclick = () => {
      user = role.value;
      tx.set_user(user);
    }
  }
  const next = document.getElementById('next');
  next.onclick = async () => {
    chains[0] = document.getElementById('mnet').value;
    chains[1] = document.getElementById('pnet').value;
    nids[0] = lib.net[chains[0]];
    nids[1] = lib.net[chains[1]];
    baseNid = user == "A"? nids[0] : nids[1];

    if (chains[0] == null || chains[1] == null || user == null) {
      alert("Please select all options");
      return;
    }

    [web3, pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y] = await tx.setup(window, nids, baseNid);

    await init(chains[0]);
    next.style.visibility = "hidden";
    next.onclick = () => {
      if (ci == false) {
        alert("Please submit common inputs");
        return;
      }
    }
  }
  // const transaction = await web3.eth.getTransaction("0xe0e0dfff459135bea682d30cee0e29e022715beb0ee9d4c1c9ab4aa77d10c9ff");

  decoder.addABI(Mixer.abi);
}

export default main();