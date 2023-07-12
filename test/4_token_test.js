const assert = require("assert");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const TokenFT = artifacts.require("TokenFT");

contract("Token", async () => {
  var x, y, registrar;

  before (async () => {
    registrar = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    y = await TokenNFT.new("y", "y");
    z = await TokenFT.new("z", "z");
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
  })

})