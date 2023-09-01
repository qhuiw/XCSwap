# An implementation for the XCSwap protocol

### Deployment
Add your desired network option in `truffle-config.js` and run migration command
```
truffle migrate --network $(network_name)$
```

### Client application
To open a client interface that participates in a two-party single-token confidential cross-chain atomic swap,
```
cd client
npm run start
```
and follow the instructions on the interface to complete transactions