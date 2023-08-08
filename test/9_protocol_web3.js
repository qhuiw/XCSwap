import { MetaMaskSDK } from '@metamask/sdk';

const MMSDK = new MetaMaskSDK(options);

const ethereum = MMSDK.getProvider(); // or window.ethereum

ethereum.request({ method: 'eth_requestAccounts', params: [] });

// const alt_bn128 = artifacts.require("alt_bn128");
// const Mixer = artifacts.require("Mixer");
// const TokenRegistrar = artifacts.require("TokenRegistrar");
// const TokenNFT = artifacts.require("TokenNFT");
// const PartialEquality = artifacts.require("PartialEquality");
// const DualRing = artifacts.require("DualRingEC");
// const DiffGenEqual = artifacts.require("DiffGenEqual");

// const SoKdp = artifacts.require("SoKdp");
// const SoKwd = artifacts.require("SoKwd");
// const SoKsp = artifacts.require("SoKsp");
// const PubParam = artifacts.require("PubParam");
// const BN = require("bn.js")

// const {Web3} = require('web3');

// const provider = new Web3.providers.HttpProvider("http://localhost:8545");

// const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));

// // Check if the browser is running MetaMask
// if (typeof window.web3 !== 'undefined') {
//   const web3 = new Web3(window.web3.currentProvider);
//   // request access to the user's MetaMask account
//   // await window.ethereum.request({ method: 'eth_requestAccounts' });
// } else {
//   // If no injected web3 instance is detected, fallback to Truffle Develop.
//   App.web3Provider = new web3.providers.HttpProvider('http://127.0.0.1:9545');
//   const web3 = new Web3(App.web3Provider);
// }

// contract("Protocol", async (accounts) => {
//   var registrar, mixA, mixB, lib;
//   const A = accounts[0];
//   const B = accounts[1];
//   var x, y;
//   const xval = 1;
//   const yval = 1;
//   const beta = [1,2,3,4];
  

//   before (async () => {
//     registrar = await TokenRegistrar.new();
//     x = await TokenNFT.new("x", "x");
//     y = await TokenNFT.new("y", "y");
//     await x.mint(A, 1);
//     await y.mint(B, 1);
//     mixA = await Mixer.new();
//     mixB = await Mixer.new();
//   })

//   it ("tests registrar works", async () => {
//     const x_b = await registrar.register(x.address);
//     const y_b = await registrar.register(y.address);
//     assert(x_b, true, "Token x register failed");
//     assert(y_b, true, "Token y register failed");
//   });

//   it ("tests isRegistered", async () => {
//     const x_b = await registrar.isRegistered(x.address);
//     assert(x_b, true, "Token x register failed");
//     const y_b = await registrar.isRegistered(y.address);
//     assert(y_b, true, "Token y register failed");
//   })

//   it ("tests mint", async () => {
//     const x_b = await x.balanceOf(A);
//     assert (x_b, 1, "Balance of A is 1");
//     const y_b = await y.balanceOf(B);
//     assert (y_b, 1, "Balance of B is 1");
//   })

// })

// function PreSwap_B () 