module.exports = {
  networks: {
    development: {
      network_id: "*",
      port: 8545,
      host: "127.0.0.1",
      websockets: true
    }
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.19"
    }
  }
};
