# XCSwap: Cross-Chain Confidential Atomic Swap Transactions with Transparent Setup

## Dependencies
```
npm install @truffle/hdwallet-provider
```

## Network Configuration
Currently, the truffle project supports the following testnets:
- [Ganache](https://trufflesuite.com/ganache/) [127.0.0.1:7545]
- [Klaytn's Baobab](https://chainlist.org/chain/1001)
- [Infura's Sepolia](https://docs.infura.io/networks/ethereum/how-to/choose-a-network)
- [Infura's Goerli](https://docs.infura.io/networks/ethereum/how-to/choose-a-network)

You could add other network option under `networks` in `truffle-config.js`.
E.g.
```
sepolia: {
  provider: () => new HDWalletProvider(mnemonic, providerOrUrl),
  network_id: "11155111",
  gas: 4465030,
  skipDryRun: true
}
```
Provide your MNEMONIC (12 word seed phrase from your Metamask wallet) and INFURA_API_KEY in a `.env` file, make sure you gitignore it for privacy.
Eg.
```
MNEMONIC="12-word seed phrase"
INFURA_API_KEY = "your key string"
```

## Deployment

### Single Chain Swap Transaction
Deploy script 1 to 6 by
```
truffle migrate --network {network} --f 1 --to 6
```
If you experience an **ETIMEDOUT** error during deployment, run migration scripts *one-by-one* 
```
truffle migrate --network {network} --f num --to num
```

#### IMPORTANT !

The current DApp does not support automatic configuration for users who operate on different machines or directories. To observe the effect of a single chain swap, deploy on your own and simulate a two-party swap by yourself.

### Cross Chain Swap Transaction

Deploy script 1 to 3 by
```
truffle migrate --network {network} --f 1 --to 3
```

Then deploy script 7 if you own `x` on your network, and ask your partner to deploy script 8 on his network; or vice versa
```
truffle migrate --network {network} --f 7/8 --to 7/8
```

If you and your partner operate on different machines or repositories, share with your partner the deployed contract information, and configure it for your partner's. This ensures both users access to the deployed contract instances correctly. 

You can obtain and configure it in the `networks` object of the contract artifacts (JSON files) that are under the `build/contract` directory. For example,
```
"networks": {
    // ChainID
    "1001": { 
      "events": {},
      // Linked library contract and its deployed address
      "links": { 
        "alt_bn128": "0x12F85ddF6346cF5dd397Cb818675608c0376235d"
      },
      // Deployed address
      "address": "0x4Ab392f56307b372D37C0fAD9E9d1BD49b19e019", 
      // Deployment Receipt
      "transactionHash": "0x66afbd9067fce5ead15fff30c3c70cc327678a49becb1a3bbba6ab6b770e5ea3"
    },
}
```



#### IMPORTANT !
One, and *Only One*, of the users should uncomment the below script in `1_lib_deploy.js` under the `migrations` directory, and configure the `<partner's node HTTP URL>` and its corresponding `<Partner's ChainID>`. For example, use Klaytn's Baobab network `"https://api.baobab.klaytn.net:8651"`, and its ChainID `1001`. 

This is to ensure both users use the same set of public parameters on their networks. If this is broken, the swap protocol will not work.

```
/* Set common Public Parameter with your partner */

  // const web3 = new Web3(new Web3.providers.HttpProvider(<partner's node HTTP URL>));
  // const pp = new web3.eth.Contract(PubParam.abi, PubParam.networks[<Partner's ChainID>].address);
  // const gs = await pp.methods.gs().call();
  // const g_pk = await pp.methods.g_pk().call();
  // const g_tag = await pp.methods.g_tag().call();
  // const h = await pp.methods.h().call();

  // const pp_here = await PubParam.deployed();
  // const tx = await pp_here.set(gs, g_pk, g_tag, h);
  // console.log("tx", tx);

  // const pp_here_gs = await pp_here.gs();

  // for (let i = 0; i < pp_here_gs.length; i++) {
  //   if (pp_here_gs[i].X != gs[i].X || pp_here_gs[i].Y != gs[i].Y) {
  //     console.log("pp_here_gs_i", pp_here_gs[i]);
  //     console.log("gs_i", gs[i]);
  //   }
  // }

```

## Client decentralised application (DApp)
To open a client interface, and participate in a cross-chain confidential atomic swap,
```
cd client
npm run start
```
and follow the instructions on the interface to complete transactions.

## MetaMask Wallet Configuration
To use the DApp, one should use an account that has sufficient cryptocurrency inside. For Ganache, [import a default account](#ganache). For public testnets, [run faucets](#testnets) 

### [Ganache](https://trufflesuite.com/ganache/): Local Development Blockchain
1. Create a Quickstart Workspace
![Quickstart](https://trufflesuite.com/img/docs/ganache/v2-shared-seese/project-listed.png)

2. Link the workspace to the project
![Link Truffle Project](https://trufflesuite.com/img/docs/ganache/ganache-home-empty.png)

3. Use the default accounts with free Ethers (ETH) in the local development blockchain
![Local Accounts](https://trufflesuite.com/img/docs/ganache/ganache-accounts.png)

4. [MetaMask Import Account](https://support.metamask.io/hc/en-us/articles/360015489331-How-to-import-an-account)  <a id="ganache"></a>
![Import Account](https://support.metamask.io/hc/article_attachments/17096511483163)


### Public Testnets <a id="testnets"></a>
1. Use default Metamask account
![Account](https://support.metamask.io/hc/article_attachments/16915535683355)
2. Obtain Free Klays(KLAY)/Ethers(ETH) on Testnets
- [Klaytn Faucet](https://baobab.wallet.klaytn.foundation/faucet)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Goerli Faucet](https://goerlifaucet.com/)

