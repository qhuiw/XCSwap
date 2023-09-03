# An implementation for the XCSwap protocol

### Dependencies
- npm install minimist

### Network Configuration
Add your desired network option in the `networks` object of the `truffle-config.js` file.
E.g.
```
Sepolia: {
  provider: () => new HDWalletProvider(MNEMONIC, INFURA_API_KEY),
  network_id: "11155111",
  gas: 4465030,
}
```
Provide your MNEMONIC and INFURA_API_KEY in `.env` file, make sure you gitignore for privacy protection.

To use local development blockchain [Ganache](https://trufflesuite.com/ganache/), download and configure the project link to `truffle-config.js`.

### Wallet Configuration
If you would like to use the local development blockchain Ganache, after launching the blockchain, import one account into your wallet for swap.

### Deployment

1. If you want to perform token exchange on the same chain, deploy script 1 by
```
truffle migrate --network $(network_name)$ --f 1 --to 1
```
Otherwise,

1. Deploy *separately* the common contracts from the main protocol by running 
```
truffle migrate --network {network_name} --f 2 --to 2
```
If you and your partner uses a different machine, share the contract addresses with your partner.

This would make sure a unique registry contract exists across all blockchain platforms.

2. Deploy script 3 if you own `x` on your network, use the flag `--nid` to specify netword id on which you deployed the common contracts
3. Ask your partner to deploy script 4 on his network; or vice versa
```
truffle migrate --network $(network_name)$ --f {num} --to {num} --nid {nid}
```
where `num = 3` or `4`

### Client application
To open a client interface that participates in a two-party single-token confidential cross-chain atomic swap,
```
cd client
npm run start
```
and follow the instructions on the interface to complete transactions