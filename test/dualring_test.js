const DualRing = artifacts.require("DualRing");


contract("DualRing", () => {

    it("test with size 8", async () =>  {

        let dualRing = await DualRing.deployed();

        await dualRing.generateKeys(8);

        const sig = await dualRing.basic_sign.call("1", 0);

        const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
            sig
        );
        console.log("size 8 basic verify used ", gasUsage1);


        });
    });


    contract("DualRing", () => {

        it("test with size 16", async () =>  {
    
            let dualRing = await DualRing.deployed();
    
            await dualRing.generateKeys(16);
    
            const sig = await dualRing.basic_sign.call("1", 0);
     
            const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
                sig
            );
            // Log the gas usage
            console.log("size 16 basic verify used ", gasUsage1);
    
    
        });
    });


    contract("DualRing", () => {

        it("test with size 32", async () =>  {
    
            let dualRing = await DualRing.deployed();
    
            await dualRing.generateKeys(32);
    
            const sig = await dualRing.basic_sign.call("1", 0);
     
            const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
                sig
            );
            // Log the gas usage
            console.log("size 32 basic verify used ", gasUsage1);
    
    
        });
    });

    contract("DualRing", () => {

        it("test with size 64", async () =>  {
    
            let dualRing = await DualRing.deployed();
    
            await dualRing.generateKeys(64);
    
            const sig = await dualRing.basic_sign.call("1", 0);
     
            const gasUsage1 = await dualRing.basic_verify.estimateGas("1",
                sig
            );
            // Log the gas usage
            console.log("size 64 basic verify used ", gasUsage1);
    
    
        });
    });
 




