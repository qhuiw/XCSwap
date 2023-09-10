### Dependencies

```
npm install parcel web3@1.10.0
```

### Command
```
npm run start
```
The script will ask [`parceljs.org`](https://parceljs.org/) generate a SSL certificate for HTTPS connection to localhost. For mac user, you might need to [add the certificate file](https://support.apple.com/en-au/guide/keychain-access/kyca2431/mac) `xx.crt` to `Keychain Access` under `System Keychains` and change under the `Trust` section the permissions to `always trust`.

Or download a local CA (e.g. [`mkcert`](https://github.com/FiloSottile/mkcert)) to certify domain names. On mac, open terminal, and 
```
brew install mkcert
brew install nss # if you use Firefox
mkcert localhost 127.0.0.1
```

### Instructions



<!-- 1) Open your terminal and type

npm install -g 

2)  root folder that you want to serve you files and type:



3) Read the output of the terminal, something kinda http://localhost:8080 will appear. -->