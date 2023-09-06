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

const datetime = () => {
  const today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  return dateTime;
}

const log = (msg) => {
  const el = document.getElementById("actlog");
  el.appendChild(createElementFromString(`<p>${datetime()} <br> ${msg}</p>`));
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

const inputpars = {
  "ERC20" : 5, //T1, T2, T3, Tmax, s
  "ERC721" : 7 //valx, valy, T1, T2, T3, Tmax, s
}

const createTitle = (id, text) => {
  return createElementFromString(
    `<div class = "content" id="${id}">
      <h4>${text}</h4>
    </div>`
  )
}

module.exports = { 
  createElementFromString, 
  createField, createMixerfield,
  insertAfter, createTitle,
  net, img, inputpars,
  rand, datetime, log
};
