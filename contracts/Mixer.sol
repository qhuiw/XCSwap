// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./lib/alt_bn128.sol";
import "./Token/Token.sol";
import "./Token/TokenRegistrar.sol";
import "./PubParam.sol";
import "./TX/SoKdp.sol";
import "./TX/SoKwd.sol";
import "./TX/SoKsp.sol";

uint constant R_size = 16;

contract Mixer {
  
  using alt_bn128 for uint256;
  using alt_bn128 for alt_bn128.G1Point;

  mapping(bytes32 => bool) _isValidAccs;
  // mapping(uint256 => mapping(uint256 => bool)) _isValidAccs;
  // mapping(uint256 => mapping(uint256 => bool)) _isValidpks;
  // mapping(uint256 => mapping(uint256 => bool)) _isValidTags;
  // mapping(bytes32 => bool) _isValidpks;
  // mapping(bytes32 => bool) _isValidTags;
  alt_bn128.G1Point[] _accs;
  alt_bn128.G1Point[] _pks;
  alt_bn128.G1Point[] _tags;

  TokenRegistrar r;
  PubParam pp;
  SoKdp dp;
  SoKwd wd;
  SoKsp sp;

  constructor (
    address r_addr, 
    address pp_addr, 
    address dp_addr,
    address wd_addr,
    address sp_addr
  ) {
    r = TokenRegistrar(r_addr);
    pp = PubParam(pp_addr);
    dp = SoKdp(dp_addr);
    wd = SoKwd(wd_addr);
    sp = SoKsp(sp_addr);

    init();
  }

  function init() public {
    alt_bn128.G1Point memory g;
    for (uint i = 0; i < R_size; i++){
      g = alt_bn128.random(i).uintToCurvePoint();
      _accs.push(g);
      // _isValidAccs[g.X][g.Y] = true; 
      // _isValidAccs[_hash(g)] = true;
    }
  }

  ///////// deposit /////////

  /// @dev user deposit token into mixer
  /// @param tx_dp deposit transaction statement
  /// @param wit witness (sk, opn, ok)
  /// @return sig deposit signature
  function deposit(SoKdp.TX memory tx_dp, uint256[3] memory wit) public returns (SoKdp.Sig memory sig){

    Token t = Token(r.getToken(tx_dp.attrS[0]));

    if (!t.isApproved(address(this), tx_dp.attrS[1])) 
      revert ("Deposit: Unsuccessful approve operation");

    sig = dp.sign(tx_dp, wit);
  }

  /// @dev mixer process deposit request
  /// @param tx_dp deposit transaction statement
  /// @param sig deposit signature
  function process_dp(SoKdp.TX memory tx_dp, SoKdp.Sig memory sig) public returns (bool) {
    /// @dev b0 ≜ T_now ∈ [T_begS ,T_endS)
    // uint256 time = block.timestamp;
    uint256 time = 0; // for testing
    bool b0 = tx_dp.attrS[2] <= time && time < tx_dp.attrS[3]; 
    require(b0, "Deposit: invalid transaction time");

    /// @dev b1 ≜ pk ∉ Σpk
    bool b1 = !_in(_pks, tx_dp.s.pk);
    // bool b1 = !_isValidpks[_hash(tx_dp.s.pk)];
    require(b1, "Deposit: pk already used");

    /// @dev b2 ≜ SoKverify(L_dp)
    bool b2 = dp.verify(tx_dp, sig);
    require(b2, "Deposit: SoKdp failed");

    if (b0 && b1 && b2){
      alt_bn128.G1Point memory Cx = tx_dp.s.tcom.add(tx_dp.s.ocom);
      _accs.push(Cx);
      // _isValidAccs[_hash(Cx)] = true;
      _pks.push(tx_dp.s.pk);
      // _isValidpks[_hash(tx_dp.s.pk)] = true;
      Token t = Token(r.getToken(tx_dp.attrS[0]));

      /// @dev ty.transfer[owner, mixer]
      return t.transfer(msg.sender, address(this), tx_dp.attrS[1]);
    }
    return false;
  }

  //////// withdraw //////////

  /// @dev withdraw token from mixer
  /// @param tx_wd withdraw transaction statement
  /// @param wit (theta, sk, opn, ok)
  function withdraw(SoKwd.TX memory tx_wd, uint256[4] memory wit) public view returns (SoKwd.Sig memory){
    return wd.sign(tx_wd, wit);
  }
  
  function process_wd(SoKwd.TX memory tx_wd, SoKwd.Sig memory sig) public returns (bool) {
    if (!isValid(tx_wd.R)) revert("Withdraw: Invalid R");

    /// @dev b0 ≜ T_now ∈ [T_begS ,T_endS)
    // uint256 time = block.timestamp;
    uint256 time = tx_wd.attrS[2]; // for testing
    bool b0 = tx_wd.attrS[2] <= time && time < tx_wd.attrS[3];
    require(b0, "Withdraw: invalid transaction time");

    /// @dev b1 = verify signature
    bool b1 = wd.verify(tx_wd, sig);
    require (b1, "Withdraw: SoKwd failed");

    /// @dev b2 ≜ tagS ∉ Σtag
    bool b2 = !_in(_tags, tx_wd.tag);
    // bool b2 = !_isValidTags[_hash(tx_wd.tag)];
    require(b2, "Withdraw: tag already used");

    if (b0 && b1 && b2) {
      _tags.push(tx_wd.tag);
      // _isValidTags[_hash(tx_wd.tag)] = true;

      Token t = Token(r.getToken(tx_wd.attrS[0]));
      /// @dev ty.transfer[mixer, rcpt]
      return t.transfer(address(this), tx_wd.u_rcpt, tx_wd.attrS[1]);
    }
    return false;
  }

  function spend(SoKsp.TX memory tx_sp, SoKsp.Wit memory wit) public view returns (SoKsp.Sig memory){
    return sp.sign(tx_sp, wit);
  }

  function process_sp(SoKsp.TX memory tx_sp, SoKsp.Sig memory sig) public returns (bool) {
    if (!isValid(tx_sp.R)) revert("Spend: Invalid R");

    // uint256 time = 5; // for testing
    /// @dev b0 ≜ T_now ∈ [T_begS ,T_endS)
    // uint256 time = block.timestamp;
    uint256 time = tx_sp.attrS[1]; // for testing
    bool b0 = tx_sp.attrS[1] <= time && time < tx_sp.attrS[2]; 
    require (b0, "Spend: invalid transaction time");

    // b1 ≜ pkT ∉ Σpk
    bool b1 = !_in(_pks, tx_sp.pk_T);
    // bool b1 = !_isValidpks[_hash(tx_sp.pk_T)];
    require(b1, "Spend: pkT already used");

    // b2 ≜ tagS ∉ Σtag
    bool b2 = !_in(_tags, tx_sp.tagS);
    // bool b2 = !_isValidTags[_hash(tx_sp.tagS)];
    require(b2, "Spend: tagS already used");

    bool b3 = sp.verify(tx_sp, sig);
    require (b3, "Spend: SoKsp failed");

    if (b0 && b1 && b2 && b3){
      _tags.push(tx_sp.tagS);
      _pks.push(tx_sp.pk_T);

      // _isValidTags[_hash(tx_sp.tagS)] = true;
      // _isValidpks[_hash(tx_sp.pk_T)] = true;

      alt_bn128.G1Point memory acc;
      for (uint i = 0; i < tx_sp.ocom_T.length; i++) {
        acc = tx_sp.tcom_T[i].add(tx_sp.ocom_T[i]);
        _accs.push(acc);
        // _isValidAccs[_hash(acc)] = true;
      }
      return true;
    }
    return false;
  }

  function get_accs() public view returns (alt_bn128.G1Point[] memory){
    return _accs;
  }

  function isValid(alt_bn128.G1Point[] memory R) public view returns (bool) {
    for (uint i = 0; i < R.length; i++) {
      if (!_in(_accs, R[i])) return false;
      // if (!_isValidAccs[_hash(R[i])]) return false;
    }
    return true;
  }

  function inAcc(alt_bn128.G1Point memory g) public view returns (bool) {
    return _in(_accs, g);
    // return _isValidAccs[_hash(g)];
  }

  function inTag(alt_bn128.G1Point memory g) public view returns (bool) {
    return _in(_tags, g);
    // return _isValidTags[_hash(g)];
  }

  function _hash(alt_bn128.G1Point memory g) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(g.X, g.Y));
  }

  function _in(
    alt_bn128.G1Point[] memory ls,
    alt_bn128.G1Point memory g
  ) private pure returns (bool) {
    for (uint i = 0 ; i < ls.length; i++) {
      if (alt_bn128.eq(ls[i], g)) return true;
    }
    return false;
  }

}

contract MixerFactory {
  address[] _mixers;

  function addMixer(address _mixer) public {
    _mixers.push(_mixer);
  }

  function getMixers() public view returns (address[] memory) {
    return _mixers;
  }
  
}