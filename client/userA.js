import Web3 from "web3";
import {useState} from "react";
// import { createRoot } from 'react-dom/client';
import lib from "../build/contracts/alt_bn128.json";

// const web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:9545');

const connectWalletHandler = async () => {

  // const [error, setError] = useState("what is happening");
  
  /* check if MetaMask is installed */
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    try {
      /* request wallet connect */
      await window.ethereum.request({ method: "eth_requestAccounts" })
      /* create web3 instance and set to state var */
      const web3 = new Web3(window.ethereum || new web3.providers.HttpProvider('http://127.0.0.1:9545'));
      /* set web3 instance to React */
      setWeb3(web3)
      /* get list of accounts */
      const accounts = await web3.eth.getAccounts()
      /* set Account 1 to React state var */
      setAddress(accounts[0])
      

      // /* create local contract copy */
      // const vm = vendingMachineContract(web3)
      // setVmContract(vm)
    } catch(err) {
      alert(err.message);
    }
  } else {
    console.log("Please install MetaMask")
  }
}

const main = async () => {
  const El = document.getElementById('connect');
  El.onclick = connectWalletHandler;

  // const root = createRoot(El);
  // root.render(<NavigationBar />);
}

// function NavigationBar() {
//   // TODO: Actually implement a navigation bar
//   return <h1>Hello from React!</h1>;
// }

export default main();