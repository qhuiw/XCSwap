module.exports = {
  networks: {
    development: {
      network_id: "*",
      port: 8545,
      host: "127.0.0.1",
      websockets: true
    }, 
    develop : {
      gasLimit : 9000000
    }
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
        // viaIR: true
      }
    }
  },
  solidityLog: {
    displayPrefix: " :"
  }

};
