const DualRingEC = artifacts.require("DualRingEC");

    contract("DualRingEC", () => {
        it("tests with size 8", async () =>  {

            let dualRingBulletproof = await DualRingEC.deployed();

            await dualRingBulletproof.generateKeys(64);

            const proof = await dualRingBulletproof.full_sign.call("1", 0);

            // Get the transaction receipt using web3
            const gasUsage = await dualRingBulletproof.full_verify.estimateGas("1",proof);

            // Log the gas usage
            console.log("size 8 used ", gasUsage);
            
            // const param = await dualRingBulletproof.get_para.call(proof);

            // console.log(param);

        });
    contract("DualRingEC", () => {
        it("tests with size 16", async () =>  {
    
            let dualRingBulletproof = await DualRingEC.deployed();
    
            await dualRingBulletproof.generateKeys(16);
    
            const proof = await dualRingBulletproof.full_sign.call("1", 0);
    
            // Get the transaction receipt using web3
            const gasUsage = await dualRingBulletproof.full_verify.estimateGas("1",proof);
    
            // Log the gas usage
            console.log("size 16 bullet-proof used ", gasUsage);
        });
    });

        it("tests with size 32", async () =>  {
    
            let dualRingBulletproof = await DualRingEC.deployed();
    
            await dualRingBulletproof.generateKeys(32);
    
            const proof = await dualRingBulletproof.full_sign.call("1", 0);
    
            // Get the transaction receipt using web3
            const gasUsage = await dualRingBulletproof.full_verify.estimateGas("1",proof);
    
            // Log the gas usage
            console.log("size 32 bullet-proof used ", gasUsage);
    
    
        });

        it("tests with size 64", async () => {
    
            let dualRingBulletproof = await DualRingEC.deployed();
    
            await dualRingBulletproof.generateKeys(64);
    
            const proof = await dualRingBulletproof.full_sign.call("1", 0);
    
            // Get the transaction receipt using web3
            const gasUsage = await dualRingBulletproof.full_verify.estimateGas("1",proof);
    
            // Log the gas usage
            console.log("size 64 bullet-proof used ", gasUsage);
        });
 
    });





