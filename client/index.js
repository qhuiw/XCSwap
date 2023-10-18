const lib = require("./utils/lib.js");
const tx = require("./utils/tx.js");
const webRTC = require("./utils/webRTC.js");

/* state */
var user, username, tktype, tknames;
var mnid, pnid;
var mixerX, mixerY, x, y;
var mci = {
  "valx": null,
  "valy": null,
  "T1": null,
  "T2": null,
  "T3": null,
  "Tmax": null
}

const get_tktype = () => {
  return tktype;
}

const get_mci = (id) => {
  return mci[id];
}

/* new page */
const init = async (platform) =>{
  const page = document.getElementById('page');
  const newpage = lib.createElementFromString(
`<div class="container" id="page2">
  <div class="columns">
    <div class="column is-four-fifths">
      <div class = "content" id="step1">
        <h4>1. Connect Metamask Wallet to ${platform.toUpperCase()}</h4>
        <div class="box">
          <button class="btn btn-primary" id="connect">
            <b> Connect to Metamask </b> 
          </button>
          <b class="is-pulled-right"> Account: NULL </b>
        </div>
      </div>
      <div class = "content" id="step2">
        <h4>2. Transaction ${(tktype == "ERC721") ? "Token and " : ""}Times </h4>
        <div class = "box">
          <div class="field has-addons">
            ${(tktype == "ERC721") ? 
            `<b> Valx: </b>
            <input type="text" class="input" name="ci-setup" placeholder="valx" id="valx">
            <b> Valy: </b>
            <input type="text" class="input" name="ci-setup" placeholder="valy" id="valy">` : ``
            }
            <b> T1: </b>
            <input type="text" class="input" name="ci-setup"
            placeholder="T1" id="T1">
            <b> T2: </b>
            <input type="text" class="input" name="ci-setup"
            placeholder="T2" id="T2">
            <b> T3: </b>
            <input type="text" class="input" name="ci-setup"
            placeholder="T3" id="T3">
            <b> Tmax: </b>
            <input type="text" class="input" name="ci-setup"
            placeholder="Tmax" id="Tmax">
            <button class="btn btn-primary" id="ci"> 
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
            <button class="btn btn-primary" id="mt">
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
            <button class="btn btn-primary" id="approvebtn">
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
            <h4> Mixer ${tknames["A"].toUpperCase()} </h4>
            <p> Address : ${mixerX.options.address} </p>
            </div>
          </div>
          <div class = "column">
            <div class = "box wrap" id="mixerY">
            <h4> Mixer ${tknames["B"].toUpperCase()} </h4>
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
        <p>${lib.datetime() +"<br> User " + lib.username[user] + " Initialized"}</p>
      </div>
    </div>
  </div> 
  
  <div class= "box wrap" id="translog">
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

  const mixerXbox = document.getElementById('mixerX');
  const mixerYbox = document.getElementById('mixerY');
  mixerXbox.appendChild(lib.createMixerfield(true, user));
  mixerYbox.appendChild(lib.createMixerfield(false, user));

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
      <button class="btn btn-primary" id="setupbutton">
        <b> Send encoded commitments and signature to your partner: </b>
      </button>
    </div>`);
  const verifyfield = lib.createElementFromString(
    `<div class="box mb-5" id="verifyfield">
      <button class="btn btn-primary" id="verifybutton">
        <b> Verify </b>
      </button>
    </div>`);

  const skcom = document.getElementById('offchain');
  var step4, step5, skbox;
  if (user == "B") {
    step4 = lib.createTitle("step4", "4. Set up with your transaction partner");
    step5 = lib.createTitle("step5", "5. Verify your partner's setup signature");
    step4.appendChild(setupfield);
    step5.appendChild(verifyfield);
    skbox = lib.createElementFromString(
      `<div class="box" id="skbox">
        <div class="content">
          <b> Wait for your partner to transmit secret key </b>
        </div>
        <button class="btn btn-primary" id="alpha-button">
          <b> Verify </b>
        </button>
      </div>`);
    skcom.appendChild(skbox);

    const alphabutton = document.getElementById('alpha-button');
    alphabutton.onclick = tx.checkAlphaB;
  } else {
    step4 = lib.createTitle("step4", "4. Verify your partner's setup signature");
    step5 = lib.createTitle("step5", "5. Set up with your transaction partner");
    step4.appendChild(verifyfield);
    step5.appendChild(setupfield);
    skbox = lib.createElementFromString(
      `<div class="box" id="skbox">
        <button class="btn btn-primary" id="alpha-button"> 
          <b>Send private key to your partner</b>
        </button>
        <p id= "skkey">  </p>  
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" type="text" placeholder="Enter B's exchange transaction hash" id="txhash">
          </div>
          <button class="btn btn-primary" id="txhash-button">
            <b>Submit</b>
          </button>
      </div>`);
    skcom.appendChild(skbox);

    const alphabutton = document.getElementById('alpha-button');
    alphabutton.onclick = tx.sendskA;

    const txhashbutton = document.getElementById('txhash-button');
    txhashbutton.onclick = tx.checkBetaA;
  }
  lib.insertAfter(step4, step3);
  lib.insertAfter(step5, step4);

  const connect = document.getElementById('connect');
  connect.onclick = tx.connectWallet;

  const cisetups = document.getElementsByName('ci-setup');
  for (const c of cisetups) {
    c.onchange = () => {
      webRTC.send({
        type: "ci",
        data: c.value,
        id: c.id
      });
      mci[c.id] = BigInt(c.value);
      lib.matchselect(mci[c.id], webRTC.get_pci(c.id), c);
    }
  }

  const cibutton = document.getElementById('ci'); 
  cibutton.onclick = tx.inputHandler.bind(null, cibutton);

  const mt = document.getElementById('mt');
  mt.onclick = tx.mint;

  const approvebtn = document.getElementById('approvebtn');
  approvebtn.onclick = tx.approve;

  const setupbutton = document.getElementById('setupbutton');
  setupbutton.onclick = (user == 'A')? tx.setupA : tx.setupB;

  const vb = document.getElementById('verifybutton');
  vb.onclick = tx.verify;
};

const main = async () => {
  const rtcsetup = document.getElementById("rtc-setup-btn");
  rtcsetup.onclick = webRTC.init;

  const rtcoffer = document.getElementById("rtc-offer-btn");
  rtcoffer.onclick = webRTC.offer;

  const netOpt = async (el, id) => {
    if (!webRTC.get_establish()) {
      alert("Please establish WebRTC channel with your partner");
      return;
    }

    const network = el.value;
    const newimg = document.createElement("div");
    newimg.innerHTML = `<img src = "${lib.img[network]}" alt="${network}" border="0" style="width:50px;height:50px" id="${id}">`;
    document.getElementById(id).replaceWith(newimg.firstChild);

    if (id.startsWith('m')) {
      webRTC.send({
        type: "pnid", 
        data: document.getElementById('mnet').value
      });
    } else {
      pnid = lib.net[document.getElementById('pnet').value];
      const pnetborder = document.getElementById("pnet-border");
      lib.matchselect(pnid, webRTC.get_pnid(), pnetborder);
    }
  }

  const pnet = document.getElementById("pnet");
  pnet.onchange=netOpt.bind(null, pnet, 'pimg');
  const mnet = document.getElementById('mnet');
  mnet.onchange=netOpt.bind(null, mnet, 'mimg');

  const roles = document.getElementsByName('r');
  for (const role of roles) {
    role.onclick = () => {
      user = role.value;
      tx.set_user(user);
      webRTC.set_user(user);
      document.title = username == null ? `XCSwap ${lib.username[user]}` : document.title;
    }
  }

  const namebutton = document.getElementById("name-button");
  namebutton.onclick = () => {
    username = document.getElementById("name-input").value.trim();
    document.title = `XCSwap ${username}`;
  }

  const t = document.getElementsByName('tkty');
  for (const tk of t) {
    tk.onclick = () => {
      if (!webRTC.get_establish()) {
        alert("Please establish WebRTC channel with your partner");
        return;
      }
      tktype = tk.value;
      tx.set_tkty(tktype);
      webRTC.send({
        type: "tktype",
        data: tktype
      })
      const tktypeborder = document.getElementById("tktype-border");
      lib.match(tktype, webRTC.get_tktype(), tktypeborder);
    }
  }

  const next = document.getElementById('next');
  next.onclick = async () => {
    if (!webRTC.get_establish()) {
      alert("Please establish WebRTC channel with your partner");
      return;
    }

    const mchain = document.getElementById('mnet').value;
    mnid = lib.net[mchain];
    pnid = lib.net[document.getElementById('pnet').value];
    tx.set_nid(mnid, pnid);

    if (pnid != webRTC.get_pnid() || tktype != webRTC.get_tktype()) {
      alert("Please match with your partner");
      return;
    }

    if (mnid == null || pnid == null || user == null || tktype == null) {
      alert("Please select all options");
      return;
    }

    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
  
    if (currentChainId != lib.chain[mchain]) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: "0x" + lib.chain[mchain].toString(16) }], // chainId must be in hexadecimal numbers
      });
    }

    [mixerX, mixerY, x, y] = await tx.setup();

    tknames = {
      "A" : await x.methods.name().call(),
      "B" : await y.methods.name().call()
    };
    
    await init(mchain);
    next.onclick = null;
    lib.username[user] = username == null ? lib.username[user] : username;
  }
}

module.exports = {
  get_tktype,
  get_mci
}

main();