import Web3 from "web3";
// import { createRoot } from 'react-dom/client';
import lib from "../build/contracts/alt_bn128.json";

var accounts = null;

const connectWalletHandler = async () => {
  /* check if MetaMask is installed */
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    try {
      /* request wallet connect */
      await window.ethereum.request({ method: "eth_requestAccounts" });
      /* create web3 instance and set to state var */
      const web3 = new Web3(window.ethereum || new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
      /* get list of accounts */
      accounts = await web3.eth.getAccounts();
      console.log(accounts);
      
    } catch(err) {
      alert(err.message);
    }
    if (accounts.length > 0) {
      const btn = document.getElementById('connect');
      btn.onclick = null;
      btn.innerHTML = "<b>You are Connected!</b>";
    }

  } else {
    console.log("Please install MetaMask")
  }
}

const main = async () => {
  const btn = document.getElementById('connect');
  // if (accounts != null) btn.style.visibility = 'hidden';
  btn.onclick = connectWalletHandler;
}

export default main();