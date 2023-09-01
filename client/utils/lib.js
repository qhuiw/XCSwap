const createElementFromString = (string) => {
  const el = document.createElement('div');
  el.innerHTML = string;
  return el.firstChild;
};

function insertAfter(newNode, existingNode) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

const net = {
  "ganache": 5777,
  "ropsten": 3,
  "rinkeby": 4,
  "goerli": 5,
  "kovan": 42,
  "mainnet": 1,
  "matic": 137,
  "mumbai": 80001,
  "klaytn" : 1001
}

const img = {
  "ganache": "https://seeklogo.com/images/G/ganache-logo-1EB72084A8-seeklogo.com.png",
  "klaytn": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9U94zW4NDEbnNRpm_0RM2zubdKjyCt8NuIHV5wSgPZg&s"
}

const rand = () => {
  const max = 1000000;
  return BigInt(Math.floor(Math.random() * max) + 1);
} 

module.exports = { 
  createElementFromString, 
  insertAfter, 
  net, img,
  rand};
