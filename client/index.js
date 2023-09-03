const lib = require("./utils/lib.js");
const tx = require("./utils/tx.js");
const decoder = require("./utils/decoder.js");
const Mixer = require("../build/contracts/Mixer.json");
const PPArt = require("../build/contracts/PubParam.json");

/* state */
var web3, account;
var user, tktype;

var pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y;

/* new page */
const init = async (platform) =>{
  const tknames = {
    "A" : await x.methods.name().call(),
    "B" : await y.methods.name().call()
  };

  const page = document.getElementById('page');
  const newpage = lib.createElementFromString(
`<div class="container" id="page2">
  <div class="columns">
    <div class="column is-four-fifths">
      <div class = "content" id="step1">
        <h4>1. Connect Metamask Wallet to ${platform[0].toUpperCase()+platform.slice(1)}</h4>
        <div class="box">
          <button class="button is-primary" id="connect">
            <b> Connect to Metamask </b> 
          </button>
          <b class="is-pulled-right"> Account: NULL </b>
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
        <div class="box" id="mtkbox">
          <h4> Token ${tknames[user].toUpperCase()} </h4>
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
              <input class="input" type="text" placeholder="Enter approve address (Mixer ${tknames['A'].toUpperCase()} for A, Mixer ${tknames['B'].toUpperCase()} for B)" id=approveaddr>
            </div>
            <button class="button is-primary" id="approve">
            <b> Approve </b>
            </button>
          </div>
        </div>

        <div class="box" id="ptkbox">
          <h4> Token ${tknames[user == 'A' ? 'B' : 'A'].toUpperCase()} </h4>
          <p> Address : ${user == 'A'? y.options.address : x.options.address} </p>
        </div>
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
      
    <div class="column">
      <div class="box wrap" style="height:100%;" id="actlog">
        <div class="content">
          <h4> Activity History </h4>
        </div>
        <p>${lib.datetime() +"<br> User " + user + " Initialized"}</p>
      </div>
    </div>
  </div> 
  
  <div class= "box" id="hist">
    <div class="content">
      <h4> Transaction History </h4>
    </div>
  </div>
</div>`);

  page.replaceWith(newpage);

  
  const mtkbox = document.getElementById('mtkbox');
  const ptkbox = document.getElementById('ptkbox');
  const mname = user == 'A' ? 'X' : 'Y';
  const pname = user == 'A' ? 'Y' : 'X';
  const btnstr = tktype == "ERC20" ? "Balance" : "Owner";
  const placeholder = tktype == "ERC20" ? "Enter account to check balance" : "Enter token value to check owner";
  mtkbox.appendChild(lib.createField(mname, "", "bal", btnstr+"Of", placeholder));
  ptkbox.appendChild(lib.createField(pname, "", "bal", btnstr+"Of", placeholder));
  mtkbox.appendChild(lib.createElementFromString(`<p id="bal-${mname}"> <b> ${btnstr}: </b> </p>`));
  ptkbox.appendChild(lib.createElementFromString(`<p id="bal-${pname}"> <b> ${btnstr}: </b> </p>`));

  const balX = document.getElementById('bal-button-X');
  const balY = document.getElementById('bal-button-Y');
  balX.onclick = tx.checkBal.bind(null, true);
  balY.onclick = tx.checkBal.bind(null, false);
  
  const createMixerfield = (isX) => {
    const name = isX ? "X" : "Y";
    const disabledBX = user == 'B' && isX ? "disabled" : "";
    const disabledBY = user == 'B' && !isX ? "disabled" : "";
    const disabledAX = user == 'A' && isX ? "disabled" : "";
    const disabledAY = user == 'A' && !isX ? "disabled" : "";
    const mixerfield = document.createElement("div");
    mixerfield.appendChild(lib.createField(name, disabledBX + disabledAY, "dp", "Deposit", "Enter token value to deposit"));
    mixerfield.appendChild(lib.createField(name, "", "wd", "Withdraw", "Enter P-account to withdraw"));
    mixerfield.appendChild(lib.createField(name, disabledBX + disabledAY, "ps", "PreSwap", 
    "Enter P-account for preswap"));
    mixerfield.appendChild(lib.createField(name, disabledBY + disabledAX, "ex", "Exchange",
    "Enter E-account for exchange"));
    mixerfield.appendChild(lib.createField(name, disabledBX + disabledAY, "rd", "Redeem", "Enter R-account for redeem"));
    mixerfield.appendChild(lib.createField(name, disabledBY + disabledAX, "isin", "CheckAcc", "Enter E-account for checking"));
    mixerfield.appendChild(lib.createField(name, disabledBX + disabledBY + disabledAY, "isintag", "CheckTag","Enter private key for checking"));

    return mixerfield;
  }
  const mixerXbox = document.getElementById('mixerX');
  const mixerYbox = document.getElementById('mixerY');
  mixerXbox.appendChild(createMixerfield(true));
  mixerYbox.appendChild(createMixerfield(false));

  const dpX = document.getElementById('dp-button-X');
  const dpY = document.getElementById('dp-button-Y');
  dpX.onclick = tx.deposit;
  dpY.onclick = tx.deposit;
  const psX = document.getElementById('ps-button-X');
  const psY = document.getElementById('ps-button-Y');
  psX.onclick = tx.preswap;
  psY.onclick = tx.preswap;
  const wdX = document.getElementById('wd-button-X');
  const wdY = document.getElementById('wd-button-Y');
  wdX.onclick = tx.withdraw.bind(null, true);
  wdY.onclick = tx.withdraw.bind(null, false);
  const reX = document.getElementById('rd-button-X');
  const reY = document.getElementById('rd-button-Y');
  reX.onclick = tx.redeem.bind(null, true);
  reY.onclick = tx.redeem.bind(null, false);
  const exX = document.getElementById('ex-button-X');
  const exY = document.getElementById('ex-button-Y');
  exX.onclick = tx.exchange;
  exY.onclick = tx.exchange;

  const isinX = document.getElementById('isin-button-X');
  const isinY = document.getElementById('isin-button-Y');
  isinX.onclick = tx.isinAcc.bind(null, true);
  isinY.onclick = tx.isinAcc.bind(null, false);

  const isinTagX = document.getElementById('isintag-button-X');
  isinTagX.onclick = tx.isinTagA;


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

  var mnid, pnid;
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

  const t = document.getElementsByName('tkty');
  for (const tk of t) {
    tk.onclick = () => {
      tktype = tk.value;
      tx.set_tkty(tktype);
    }
  }

  const next = document.getElementById('next');
  next.onclick = async () => {
    const mchain = document.getElementById('mnet').value;
    mnid = lib.net[mchain];
    pnid = lib.net[document.getElementById('pnet').value];
    baseNid = user == "A"? mnid : pnid;

    if (mnid == null || pnid == null || user == null || tktype == null) {
      alert("Please select all options");
      return;
    }

    [web3, pp, ba, ab, mixerX, mixerY, x, y, reg, ty_x, ty_y] = await tx.setup(window, mnid, pnid, baseNid);

    await init(mchain);
  }
  decoder.addABI(Mixer.abi);
}

export default main();