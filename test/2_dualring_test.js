const DualRing = artifacts.require("DualRing");
const assert = require("assert");

contract("DualRing", async () => {
    const m = "message";
    const skj = [3,1];
    const size = [4,8,16,32,64];
    

    // beforeEach(async () => {
        
    // })

    for (let i = 0; i < size.length; i++){
        it("test with size " + size[i], async () =>  {
            const dr = await DualRing.deployed();
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
 




