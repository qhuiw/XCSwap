const DualRingEC = artifacts.require("DualRingEC");
const alt_bn128 = artifacts.require("alt_bn128");
const assert = require("assert");
const web3 = require("web3");

contract("DualRingEC", async () => {
    var lib, drEC;
    const m = web3.eth.abi.encodeParameter("string", "message");
    const skj = [3,1];
    const size = [4,8,16,32,64];

    before (async () => {
        lib = await alt_bn128.new();
        await DualRingEC.link(lib);
        drEC = await DualRingEC.deployed();
    });
    
    for (let i = 0; i < size.length; i++){
        it("tests with size " + size[i], async () =>  {
            const pp = await drEC.setupEC.call(size[i], skj);

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