const lib = require("./lib.js");

const config = {
  iceServers: [{urls : 'stun:stun.l.google.com:19302'}]
};

var dataChannelOptions = {
  reliable: true,
  maxRetransmitTime: 3000
};

var user, polite;
var established = false;
var makingOffer = false;
var ignoreOffer = false;
var pc, sendChannel, recvChannel, hasCand = false;
var pnid = lib.net[document.getElementById('pnet').value];
var ptktype;
var encode, alpha;
const rtcbox = document.getElementById("rtcbox");

var pci = {
  "valx": null,
  "valy": null,
  "T1": null,
  "T2": null,
  "T3": null,
  "Tmax": null
};

var setupMsg = {
  "description" : null,
  "candidate" : null
};

const set_user = (u) => {
  user = u;
}

const get_establish = () => {
  return established;
}

const get_encode = () => {
  return encode;
}

const get_alpha = () => {
  return alpha;
}

const get_pnid = () => {
  return pnid;
}

const get_tktype = () => {
  return ptktype;
}

const get_pci = (id) => {
  return pci[id];
}

const init = async () => {
  if (user == null) {
    alert("Please select setup order");
    return;
  }
  polite = user == "A" ? true : false;

  pc = new RTCPeerConnection(config);

  pc.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await pc.setLocalDescription();

      if (!polite) {
        setupMsg["description"] = pc.localDescription;
      } else {
        rtcbox.appendChild(lib.createElementFromString(`<p> <b> Wait for your partner's SDP and paste onto the box below </b> </p>`))
      }

    } catch (err) {
      console.error(err);
    } finally {
      makingOffer = false;
    }
  };

  pc.onicecandidate = ({candidate}) => {
    if (!hasCand && !polite) {
      setupMsg["candidate"] = candidate;
      rtcbox.appendChild(lib.createElementFromString(`<p> <b>Send to your partner: </b> <br>
        ${JSON.stringify(setupMsg)}
      </p>`))
      hasCand = true;
    }
  }

  pc.ondatachannel = (event) =>{
    alert("WebRTC connection established");
    

    const roles = document.getElementsByName('r');
    for (const role of roles) {
      role.disabled = true;
      role.onclick = null;
    }

    recvChannel = event.channel;

    recvChannel.onmessage = async (event) => {
      const data = JSON.parse(atob(event.data));
      if (data.type == "setup") {
        encode = data.data;
        const verifyfield = document.getElementById("verifyfield");
        verifyfield.insertBefore(lib.createElementFromString("<p><b>Ready to verify </b></p>"), verifyfield.firstChild);
      } else if (data.type == "alpha") {
        alpha = BigInt(data.data);
        const skbox = document.getElementById("skbox");
        skbox.insertBefore(lib.createElementFromString("<p><b>Ready to verify </b></p>"), skbox.lastChild);
      } else if (data.type == "pnid") {
        const pchain = data.data;
        pnid = lib.net[pchain];
        const pnetbox = document.getElementById("pnetbox");
        pnetbox.innerHTML = `Partner's Network: ${pchain.toUpperCase()}`;
        const pnetborder = document.getElementById("pnet-border");
        lib.matchselect(pnid, lib.net[document.getElementById("pnet").value], pnetborder);
      } else if (data.type == "tktype") {
        ptktype = data.data;
        const tktypebox = document.getElementById("tktypebox");
        tktypebox.innerHTML = `Transaction Token: Partner has chosen ${ptktype}`;
        const tktypeborder = document.getElementById("tktype-border");
        const {get_tktype} = require("../index.js");
        lib.match(ptktype, get_tktype(), tktypeborder);
      } else if (data.type == "s") {
        const s = BigInt(data.data);
        const {set_s} = require("./tx.js");
        set_s(s);
      } else if (data.type == "ci") {
        pci[data.id] = BigInt(data.data);
        const {get_mci} = require("../index.js");
        const el = document.getElementById(data.id);
        if (el == null) return;
        el.placeholder = pci[data.id].toString();
        lib.matchselect(pci[data.id], get_mci(data.id), el);
      }
    }

    established = true;
};

  sendChannel = pc.createDataChannel("My Channel", dataChannelOptions);

  sendChannel.onopen = () => {
    send({
      type: "pnid",
      data: document.getElementById("mnet").value
    });
    if (user == "B") {
      const s = lib.rand();
      const {set_s} = require("./tx.js");
      set_s(s);
      send({
        type: "s",
        data: s.toString()
      });
    }
  }
}

const send = (data) => {
  console.log(data);
  sendChannel.send(btoa(JSON.stringify(data)));
}

const offer = async () => {
  const data = JSON.parse(document.getElementById("rtc-offer").value);

  if (polite == null) {
    alert("Please initiate RTC setup");
    return;
  }

  try {
    if (data.description) {
      const description = data.description;
      const offerCollision =
        description.type === "offer" &&
        (makingOffer || pc.signalingState !== "stable");

      ignoreOffer = !polite && offerCollision;
      if (ignoreOffer) {
        return;
      }

      await pc.setRemoteDescription(description);
      if (description.type === "offer") {
        await pc.setLocalDescription();
        rtcbox.appendChild(lib.createElementFromString(
          `<p><b>Send to your partner: </b> <br>
          ${JSON.stringify( { description: pc.localDescription} )}</p>
          `));
      }
    } 
    
    if (data.candidate) {
      try {
        await pc.addIceCandidate(data.candidate);
      } catch (err) {
        if (!ignoreOffer) {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

}

module.exports = {
  set_user,
  get_establish,
  get_tktype,
  get_pnid,
  get_pci,
  init, offer, send,
  get_encode,
  get_alpha
};