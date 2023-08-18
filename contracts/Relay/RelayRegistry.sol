// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

uint constant num = 16;

contract RelayRegistry {

  address[] _relays;

  constructor () {
    for (uint i = 0; i < num; i++){
      _relays.push(_randomAddr(i));
    }
  }

  function getRelay(uint i) public view returns (address){
    return _relays[i % _relays.length];
  }

  function _randomAddr(uint i) private view returns(address){
    return address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, i)))));
  }

}