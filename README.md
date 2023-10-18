# XCSwap: Cross-Chain Confidential Atomic Swap Transactions with Transparent Setups

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

### Same Chain Transaction
Deploy script 1 to 6 by
```
truffle migrate --network {network} --f 1 --to 6
```
If you experience a **ETIMEDOUT** error during deployment, run migration scripts *one-by-one* 
```
truffle migrate --network {network} --f num --to num
```

If you and your partner operate on different machines, share the contract artifacts under `build/contract` directory with your partner. This ensures both parties access to singleton contract instances correctly.

### Cross Chain Transaction

Deploy script 1 to 3 by
```
truffle migrate --network {network} --f 1 --to 3
```

- Deploy script 7 if you own `x` on your network, use `--nid` to specify id of network on which you deployed the common contracts
- Ask your partner to deploy script 8 on his network; or vice versa
```
truffle migrate --network {network} --f 7/8 --to 7/8 --nid {nid}
```

### Client application
To open a client interface that participates in a two-party single-token confidential cross-chain atomic swap,
```
cd client
npm run start
```
and follow the instructions on the interface to complete transactions

## Wallet Configuration
### [Ganache](https://trufflesuite.com/ganache/)
1. Create a Quickstart Workspace
![Quickstart](https://trufflesuite.com/img/docs/ganache/v2-shared-seese/project-listed.png)

2. Link the workspace to the project
![Link Truffle Project](https://trufflesuite.com/img/docs/ganache/ganache-home-empty.png)

3. Use the default accounts in wallet
![Local Accounts](https://trufflesuite.com/img/docs/ganache/ganache-accounts.png)



1. [Metamask Import Account](https://support.metamask.io/hc/en-us/articles/360015489331-How-to-import-an-account)
![Import Account](https://support.metamask.io/hc/article_attachments/17096511483163)

### Public Testnets
1. Use default Metamask account
![Account](https://support.metamask.io/hc/article_attachments/16915535683355)
2. Obtain Free Ethers on Testnets
- [Klaytn Faucet](https://baobab.wallet.klaytn.foundation/faucet)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Goerli Faucet](https://goerlifaucet.com/)

