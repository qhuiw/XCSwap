const DualRing = artifacts.require("DualRing");
const assert = require("assert");

contract("DualRing", () => {
    const m = "message";
    const skj = [3,1];
    const size = [4,8,16,32,64];

    for (let i = 0; i < size.length; i++){
        it("test with size ", async () =>  {
            let dr = await DualRing.deployed();
            const pp = await dr.setup(size[i], skj);
            const sig = await dr.basic_sign.call(m, 0);
            assert(nisa.verify.call(pp, m, sig), true, "DualRing is incorrect");
            const gasUsage1 = await dr.basic_verify.estimateGas("1", sig);
            console.log("size 8 basic verify used ", gasUsage1);
        });
    }   
});


    // contract("DualRing", () => {

    //     it("test with size 16", async () =>  {
    
    //         let dualRing = await DualRing.deployed();
    
    //         await dualRing.generateKeys(16);
    
    //         const sig = await dualRing.basic_sign.call("1", 0);
     
    //         const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
    //             sig
    //         );
    //         // Log the gas usage
    //         console.log("size 16 basic verify used ", gasUsage1);
    
    
    //     });
    // });


    // contract("DualRing", () => {

    //     it("test with size 32", async () =>  {
    
    //         let dualRing = await DualRing.deployed();
    
    //         await dualRing.generateKeys(32);
    
    //         const sig = await dualRing.basic_sign.call("1", 0);
     
    //         const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
    //             sig
    //         );
    //         // Log the gas usage
    //         console.log("size 32 basic verify used ", gasUsage1);
    
    
    //     });
    // });

    // contract("DualRing", () => {

    //     it("test with size 64", async () =>  {
    
    //         let dualRing = await DualRing.deployed();
    
    //         await dualRing.generateKeys(64);
    
    //         const sig = await dualRing.basic_sign.call("1", 0);
     
    //         const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
    //             sig
    //         );
    //         // Log the gas usage
    //         console.log("size 64 basic verify used ", gasUsage1);
    
    
    //     });
    // });
 




