const assert = require("assert");
const TokenRegistrar = artifacts.require("TokenRegistrar");
const TokenNFT = artifacts.require("TokenNFT");
const TokenFT = artifacts.require("TokenFT");

contract("Token", async (accounts) => {
  const A = accounts[0];
  const B = accounts[1];
  const Aval = 1;
  const Bval = 1;
  var x, y, registrar;

  before (async () => {
    registrar = await TokenRegistrar.new();
    x = await TokenNFT.new("x", "x");
    y = await TokenNFT.new("y", "y");
  })

  it ("tests register", async () => {
    const x_b = await registrar.register(x.address);
    const y_b = await registrar.register(y.address);
    assert(x_b, true, "Token x register failed");
    assert(y_b, true, "Token y register failed");
  });

  it ("tests isRegistered", async () => {
    const x_b = await registrar.isRegistered(x.address);
    assert(x_b, true, "Token x register failed");
  })

  it ("tests mint and balance", async () => {
    await x.mint(A, Aval);
    await y.mint(B, Bval);
    const x_b = await x.balanceOf(A);
    assert (x_b, 1, "Balance of A is 1");
    const y_b = await y.balanceOf(B);
    assert (y_b, 1, "Balance of B is 1");
  })

  it ("tests approve", async () => {
    const b = await x.approve(B, Aval, {from : A});
    assert(b, true, "Approve does not work");
    // const f = await x.approve(A, Aval, {from : A});
    // assert(f, false);
  })

})