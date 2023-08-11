const assert = require('assert');
const alt_bn128 = artifacts.require("alt_bn128");
const oneofmany = artifacts.require("OneofMany");

contract("OneofMany", async () => {
  var lib, oom;
  const skj = [3 ,1];
  const size = [4, 8, 16, 32, 64];

  before (async () => {
    lib = await alt_bn128.new();
    await oneofmany.link(lib);
    oom = await oneofmany.new();
  });

  for (let i = 0; i < size.length; i++) {
    it("tests size "+ size[i], async () => {
      const pp = await oom.setup.call(size[i], skj);

      const sig = await oom.sign.call(pp, skj);

      const bool = await oom.verify.call(pp, sig);

      assert.equal(bool, true, "OneofMany failed");
    });
  }
});
