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

const chain = {
  "ganache" :1337,
  "ropsten" : 3,
  "rinkeby" : 4,
  "goerli" : 5,
  "kovan" : 42,
  "mainnet" : 1,
  "matic" : 137,
  "mumbai" : 80001,
  "klaytn" : 1001
}

const img = {
  "ganache": "https://seeklogo.com/images/G/ganache-logo-1EB72084A8-seeklogo.com.png",
  "klaytn": "https://cdn-images-1.medium.com/max/1200/1*3tSS6q_D-lyttNdlRwqoQw.png",
  "sepolia" : "https://assets-global.website-files.com/5f973c970bea5548ad4287ef/6222bb0250fe44753a7579cd_starknet-icon.svg",
  "goerli": "https://assets-global.website-files.com/5f973c97cf5aea614f93a26c/6451a34baee26f54b2419cf3_base-logo.png"
}

const rand = () => {
  const max = 1000000;
  return BigInt(Math.floor(Math.random() * max) + 1);
} 

const datetime = () => {
  const today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  return dateTime;
}

const actlog = (msg) => {
  const el = document.getElementById("actlog");
  el.appendChild(createElementFromString(`<p>${datetime()} <br> ${msg}</p>`));
}

const translog = (msg, tx) => {
  const el = document.getElementById("translog");
  el.appendChild(createElementFromString(`<p>${datetime()} ${msg}</p>`));
  el.appendChild(txformat(tx));
}

const txformat = (tx) => {
  return createElementFromString(
    `<p>"transactionHash" : ${tx.transactionHash},<br>
    "from" : ${tx.from},<br>
    "to" : ${tx.to},<br>
    "gasUsed" : ${tx.gasUsed},<br>
    "blockNumber" : ${tx.blockNumber}
    </p>`);
}

const createField = (name, disabled, id, buttonName, placeholder) => {
  return createElementFromString(
    `<div class="field has-addons">
      <div class="control is-expanded">
        <input class="input" type="text" placeholder="${placeholder}" id="${id}-input-${name}" ${disabled}>
      </div>
      <button class="btn btn-primary" id="${id}-button-${name}" ${disabled}>
        <b>${buttonName}</b>
      </button>
    </div>`);
}

const createMixerfield = (isX, user) => {
  const name = isX ? "X" : "Y";
  const disabledBX = user == 'B' && isX ? "disabled" : "";
  const disabledBY = user == 'B' && !isX ? "disabled" : "";
  const disabledAX = user == 'A' && isX ? "disabled" : "";
  const disabledAY = user == 'A' && !isX ? "disabled" : "";
  const mixerfield = document.createElement("div");
  mixerfield.appendChild(createField(name, disabledBX + disabledAY, "dp", "Deposit", "Enter token value to deposit"));
  mixerfield.appendChild(createField(name, "", "wd", "Withdraw", "Enter P-account to withdraw"));
  mixerfield.appendChild(createField(name, disabledBX + disabledAY, "ps", "PreSwap", 
  "Enter P-account for preswap"));
  mixerfield.appendChild(createField(name, disabledBY + disabledAX, "ex", "Exchange",
  "Enter E-account for exchange"));
  mixerfield.appendChild(createField(name, disabledBX + disabledAY, "rd", "Redeem", "Enter R-account for redeem"));
  mixerfield.appendChild(createField(name, disabledBY + disabledAX, "isin", "CheckAcc", "Enter E-account for checking"));
  mixerfield.appendChild(createField(name, disabledBX + disabledBY + disabledAY, "isintag", "CheckTag","Enter private key for checking"));

  return mixerfield;
}

const match = (a, b, el) => {
  if (a != b) {
    el.classList.remove("has-background-primary-light");
    el.classList.add("has-background-danger-light");
  } else {
    el.classList.remove("has-background-danger-light");
    el.classList.add("has-background-primary-light");
  }
}

const matchselect = (a, b, el) => {
  if (a != b) {
    el.classList.remove("is-primary");
    el.classList.add("is-danger");
  } else {
    el.classList.remove("is-danger");
    el.classList.add("is-primary");
  }
}

const inputpars = {
  "ERC20" : ["T1", "T2", "T3", "Tmax"],
  "ERC721" : ["valx", "valy", "T1", "T2", "T3", "Tmax"]
}

const createTitle = (id, text) => {
  return createElementFromString(
    `<div class = "content" id="${id}">
      <h4>${text}</h4>
    </div>`
  )
}

const username = {
  "A" : "Alice",
  "B" : "Bob"
}

module.exports = { 
  createElementFromString, 
  createField, createMixerfield,
  insertAfter, createTitle, 
  match, matchselect, chain,
  net, img, inputpars, username,
  rand, datetime, actlog, translog
};
