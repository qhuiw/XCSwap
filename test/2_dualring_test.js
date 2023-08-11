const DualRing = artifacts.require("DualRing");
const alt_bn128 = artifacts.require("alt_bn128");
const assert = require("assert");
const web3 = require("web3");

contract("DualRing", async () => {
    var lib, dr;
    const m = web3.eth.abi.encodeParameter("string", "message");
    const skj = [3,1];
    const size = [4,8,16,32,64];

    before (async () => {
        lib = await alt_bn128.new();
        await DualRing.link(lib);
        dr = await DualRing.new();
    });
    
    for (let i = 0; i < size.length; i++){
        it("test with size " + size[i], async () =>  {
            const pp = await dr.setup(size[i], skj);
            const {sig, _} = await dr.sign.call(pp, m, skj);
            const b = await dr.verify.call(pp, m, sig);
            assert(b, true, "DualRing is incorrect");
            // const gasUsage1 = await dr.basic_verify.estimateGas("1", sig);
            // console.log("size 8 basic verify used ", gasUsage1);
        });
    }   
});



