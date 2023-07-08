const NISA = artifacts.require("NISA");
const assert = require("assert");

contract("NISA", async () => {
  let size = [4,8,16,32,64];
  var idx = 0;
  var a, nisa, pp, sig, usage;

  beforeEach(async () => {
    a = new Array(size[idx]);
    console.log("vector length " + size[idx]);
    for (let j = 0; j < a.length; j++){
      a[j] = j+1;
    }
    nisa = await NISA.deployed();
    pp = await nisa.setup.call(a);
    sig = await nisa.prove.call(pp, a);
  })
  
  afterEach(async () => {
    usage = await nisa.verify.estimateGas(pp, sig);
    console.log("gas usage: ", usage);
    idx++;
  })
  // console.log("vector length", a.length);

  for (let i = 0; i < size.length; i++){
    it("tests with vector size " + size[i], async () => {
      // let nisa = await NISA.deployed();
      // const pp = await nisa.setup.call(a);
      // const sig = await nisa.prove.call(pp, a);
      const b = await nisa.verify.call(pp, sig);
      assert(b, true, "NISA is incorrect");
      // console.log("gas usage: ", usage);
    });
  }
  // it("tests with vector size " + 4, async () => {
  //   let nisa = await NISA.deployed();
  //   const a = [1,2,3,4];
  //   const pp = await nisa.setup.call(a);
  //   const sig = await nisa.prove.call(pp, a);
  //   assert(await nisa.verify.call(pp, sig), true, "NISA is incorrect");
  //   // console.log("gas usage: ", await nisa.verify.estimateGas(pp, sig));
  // });

  // it("tests with vector size " + 8, async () => {
  //   let nisa = await NISA.deployed();
  //   const a = [1,2,3,4,5,6,7,8];
  //   const pp = await nisa.setup.call(a);
  //   const sig = await nisa.prove.call(pp, a);
  //   const b = await nisa.verify.call(pp, sig);
  //   assert(b, true, "NISA is incorrect");
  //   // console.log("gas usage:", b.receipt.gasUsed);
  //   // console.log("gas usage: ", await nisa.verify.estimateGas(pp, sig));
  // });
  

})