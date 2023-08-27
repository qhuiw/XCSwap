const createElementFromString = (string) => {
  const el = document.createElement('div');
  el.innerHTML = string;
  return el.firstChild;
};

function insertAfter(newNode, existingNode) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

function getRPCErrorMessage(err){
  // var open = err.stack.indexOf('{')
  // var close = err.stack.lastIndexOf('}')
  // var j_s = err.stack.substring(open, close + 1);
  // var j = JSON.parse(j_s);
  // var reason = j.data[Object.keys(j.data)[0]].reason;
  // return reason;
}

const net = {
  "truffle": 5777,
  "ropsten": 3,
  "rinkeby": 4,
  "goerli": 5,
  "kovan": 42,
  "mainnet": 1,
  "matic": 137,
  "mumbai": 80001,
  "klaytn" : 1001
}

const rand = () => {
  const max = 1000000;
  return Math.floor(Math.random() * max) + 1;
} 

module.exports = { createElementFromString, insertAfter, net, rand, getRPCErrorMessage };
