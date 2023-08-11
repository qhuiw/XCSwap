const NISA = artifacts.require("NISA");
const alt_bn128 = artifacts.require("alt_bn128");
const assert = require("assert");

contract("NISA", async () => {
  let size = [4,8,16,32,64];
  var lib, nisa;

  before (async () => {
    lib = await alt_bn128.new();
    await NISA.link(lib);
    nisa = await NISA.new();
  });

  for (let i = 0; i < size.length; i++){
    it("tests with vector size " + size[i], async () => {

      const a = new Array(size[i]);
      console.log("vector length " + size[i]);
      for (let j = 0; j < a.length; j++){
        a[j] = j+1;
      }

      const pp = await nisa.setup.call(a);
      const sig = await nisa.prove.call(pp, a);

      const b = await nisa.verify.call(pp, sig);
      assert(b, true, "NISA is incorrect");
      
      usage = await nisa.verify.estimateGas(pp, sig);
      console.log("gas usage: ", usage);
    });
  }

})