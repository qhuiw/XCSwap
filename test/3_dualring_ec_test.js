const DualRingEC = artifacts.require("DualRingEC");
const assert = require("assert");
const web3 = require("web3");

contract("DualRingEC", async () => {
    const m = web3.eth.abi.encodeParameter("string", "message");
    const skj = [3,1];
    const size = [4,8,16,32,64];
    var n, drEC;
    
    for (let i = 0; i < size.length; i++){
        it("tests with size " + size[i], async () =>  {

            let drEC = await DualRingEC.deployed();
            // const l = await lib.deployed();
            // DualRingEC.link(l);
            // const n = await nisa.deployed();
            // let drEC = await DualRingEC.new(n.address);

            const pp = await drEC.setupEC(size[i], skj);

            const sig = await drEC.signEC.call(pp, m, skj);

            const b = await drEC.verifyEC.call(pp, m, sig);

            assert(b, true, "DualRingEC is incorrect");

            // Get the transaction receipt using web3
            // const gasUsage = await drEC.full_verify.estimateGas("1",proof);

            // gas usage
            // console.log("size 8 used ", gasUsage);
        });
    }
});