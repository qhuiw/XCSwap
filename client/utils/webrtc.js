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
let makingOffer = false;
let ignoreOffer = false;
var pc, sendChannel, recvChannel, hasCand = false; 
var encode, alpha;
// signalling channel
const rtcbox = document.getElementById("rtcbox");

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
    recvChannel = event.channel;
    recvChannel.onopen = () => {
      console.log("Recv channel open");
    };

    recvChannel.onmessage = async (event) => {
      // console.log(event);
      const data = JSON.parse(atob(event.data));
      console.log(data);
      if (data.type == "setup") {
        // set_encode(data.data);
        encode = data.data;
        const verifyfield = document.getElementById("verifyfield");
        verifyfield.insertBefore(lib.createElementFromString("<p><b>Ready to verify </b></p>"), verifyfield.firstChild);
      } else if (data.type == "alpha") {
        // set_alpha(data.data);
        alpha = data.data;
        const skbox = document.getElementById("skbox");
        skbox.insertBefore(lib.createElementFromString("<p><b>Ready to verify </b></p>"), skbox.firstChild);
      }
    }
    recvChannel.onclose = () => { 
      console.log("Recv channel closed."); 
    };
    established = true;
};

  sendChannel = pc.createDataChannel("My Channel", dataChannelOptions);

  sendChannel.onopen = () => {
    console.log("Send channel open");
    const obj = { hello: "world" };
    const data = btoa(JSON.stringify(obj));
    sendChannel.send(data);
  };
    
  sendChannel.onmessage = (event) => {
    console.log("sendChannel received message:", event.data);
  };
  
  sendChannel.onclose = () => { console.log("Send channel closed."); };

}

const send = (data) => {
  console.log(data);
  sendChannel.send(btoa(JSON.stringify(data)));
}

const offer= async () => {
  const data = JSON.parse(document.getElementById("rtc-offer").value);

  console.log(data);

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
  init, offer, send,
  get_encode,
  get_alpha
};