/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

require('dotenv').config();
const mnemonic = process.env["MNEMONIC"];
const infuraAPIKey = process.env["INFURA_API_KEY"];
 
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      network_id: "*",
      port: 7545,
      host: "127.0.0.1",
      gas : 6721975,
      websockets: true
    },
    sepolia: {
      provider: () => new HDWalletProvider(mnemonic, "https://sepolia.infura.io/v3/"+infuraAPIKey),
      network_id: "11155111",
      gas: 4465030,
      skipDryRun: true
    },
    goerli: {
      provider: () => new HDWalletProvider(mnemonic, "https://goerli.infura.io/v3/"+infuraAPIKey),
      network_id: "5",
      gas: 4465030,
      skipDryRun: true
    },
    baobab: {
      provider: () =>  new HDWalletProvider(mnemonic, "https://api.baobab.klaytn.net:8651"),
      network_id: "1001",
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    }
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },
  solidityLog: {
    displayPrefix: " :"
  },
  plugins: [
    'truffle-contract-size'
  ]

};
