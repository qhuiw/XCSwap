const config = {
  iceServers: [{urls : 'stun:stun.l.google.com:19302'}]
};

const signaler = new SignalingChannel();
const pc = new RTCPeerConnection(config);


let makingOffer = false;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription();
    signaler.send({ description: pc.localDescription });
  } catch (err) {
    console.error(err);
  } finally {
    makingOffer = false;
  }
};

const dataChannelOptions = {
  ordered: false, // do not guarantee order
  maxPacketLifeTime: 3000, // in milliseconds
};

let dataChannel = pc.createDataChannel("MyApp Channel");

dataChannel.onopen = () => {
  console.log("Data channel is open and ready to be used.");
  // beginTransmission(dataChannel);
};

dataChannel.onmessage = (event) => {
  console.log("Received message:", event.data);
};

dataChannel.onclose = () => { console.log("Data channel closed."); };




module.exports = {
  pc, dataChannel, signaler
};