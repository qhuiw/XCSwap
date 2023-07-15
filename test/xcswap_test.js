const assert = require("assert");
const alt_bn128 = artifacts.require("alt_bn128");
const Mixer = artifacts.require("Mixer");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
// const TokenFT = artifacts.require("TokenFT");

contract("Token", async (accounts) => {
  var registrar, mixA, mixB, lib;
  const A = accounts[0];
  const B = accounts[1];
  var x, y;
  const xval = 1;
  const yval = 1;
  const beta = [1,2,3,4];
  

  before (async () => {
    registrar = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    y = await TokenNFT.new("y", "y");
    await x.mint(A, 1);
    await y.mint(B, 1);
    mixA = await Mixer.new();
    mixB = await Mixer.new();
  })

  it ("tests registrar works", async () => {
    const x_b = await registrar.register(x.address);
    const y_b = await registrar.register(y.address);
    assert(x_b, true, "Token x register failed");
    assert(y_b, true, "Token y register failed");
  });

  it ("tests isRegistered", async () => {
    const x_b = await registrar.isRegistered(x.address);
    assert(x_b, true, "Token x register failed");
    const y_b = await registrar.isRegistered(y.address);
    assert(y_b, true, "Token y register failed");
  })

  it ("tests mint", async () => {
    const x_b = await x.balanceOf(A);
    assert (x_b, 1, "Balance of A is 1");
    const y_b = await y.balanceOf(B);
    assert (y_b, 1, "Balance of B is 1");
  })

})