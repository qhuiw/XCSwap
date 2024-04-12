// SPDX-License-Identifier: GPL-3.0
/// @dev RelayRegistry is a contract that manages the registration of relayers
/// still under development
pragma solidity >=0.4.0 <0.9.0;

import "../Mixer.sol";

uint constant num = 4;

contract RelayRegistry {

  address payable[] _relays;
  uint256 public constant stake = 1 ether;
  mapping(address => bool) public isRelayer;
  mapping(address => uint256) public balances;

  constructor () {
    /// @dev for development, assume a set of registered relayers
    for (uint i = 0; i < num; i++){
      _relays.push(payable(_randomAddr(i)));
    }
  }

  /// @dev for whom wishing to register as a relayer
  /// need to prove to the registry that they have sufficient balance to pay for transaction fees
  /// on behalf of the users ?? then registry pay for the user?? or should it be an offchain logic in JS? 
  function registerRelay() public payable {
    require(msg.value >= stake, "Insufficient stake");
    isRelayer[msg.sender] = true;
    balances[msg.sender] = msg.value;
    payable(address(this)).transfer(msg.value);
  }

  function getRelay(uint i) public view returns (address){
    return _relays[i % _relays.length];
  }

  // function relayWithdraw(
  //   address payable to, 
  //   address mixer, 
  //   SoKwd.TX memory tx_wd, 
  //   SoKwd.Sig memory sig
  // ) payable public {
  //   require(isRelayer[to], "Not a relayer");
  //   require(msg.value >= .2 ether, "Insufficient fee");
  //   to.transfer(msg.value);
  //   Mixer(mixer).process_wd(tx_wd, sig);
  // }

  function _randomAddr(uint i) private view returns(address){
    return address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, i)))));
  }

}