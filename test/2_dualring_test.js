const DualRing = artifacts.require("DualRing");
const assert = require("assert");
const web3 = require("web3");

contract("DualRing", async () => {
    const m = web3.eth.abi.encodeParameter("string", "message");
    const skj = [3,1];
    const size = [4,8,16,32,64];
    

    for (let i = 0; i < size.length; i++){
        it("test with size " + size[i], async () =>  {
            const dr = await DualRing.new();
            // const dr = await DualRing.new();
            // console.log(dr.address);
            const pp = await dr.setup(size[i], skj);
            const {sig, _} = await dr.sign.call(pp, m, skj);
            const b = await dr.verify.call(pp, m, sig);
            assert(b, true, "DualRing is incorrect");
            // const gasUsage1 = await dr.basic_verify.estimateGas("1", sig);
            // console.log("size 8 basic verify used ", gasUsage1);
        });
    }   
});



