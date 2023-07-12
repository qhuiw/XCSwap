// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";

/**
 * @dev ERC721
 */
contract TokenNFT is Token {

  /// @dev token id => _owners
  mapping(uint256 => address) private _owners;
  /// @dev _owners => token count
  mapping(address => uint256) private _balances;
  /// @dev token id => approved address
  mapping(uint256 => address) private _tokenApproval;
  /// @dev _owners => (operator => approved?)
  mapping(address => mapping(address => bool)) private _operatorApproval;

  constructor (string memory _name, string memory _symbol) Token(_name, _symbol) {}

  function approve(address to, uint256 tokenId) public returns (bool) {
    address owner = ownerOf(tokenId);
    if (to == owner) revert ("Invalid Operator");
    if (msg.sender != owner) revert("Invalid Approver");

    _tokenApproval[tokenId] = to;
    return true;
  }

  function transfer(address from, address to, uint256 tokenId) public returns (bool) {
    address owner = ownerOf(tokenId);
    if (owner != from) revert ("Incorrect Owner");
    if (to == address(0)) revert ("Invalid Receiver");
    /// @dev could extend to _operatorApproval
    if (msg.sender == owner || msg.sender == _tokenApproval[tokenId]) {
      // Clear approvals from the previous owner
      delete _tokenApproval[tokenId];
      // transfer 
      _balances[from] -= 1;
      _balances[to] += 1;

      _owners[tokenId] = to;
      return true;
    }

    return false;
  }

  /// @dev create a token for address to
  /// @param to account address
  /// @param tokenId token ID
  function mint(address to, uint256 tokenId) public {
    if (_exists(tokenId)) revert("Mint: Token ID exists");
    if (to == address(0)) revert("Mint: Invalid receiver address");
    _balances[to] += 1;
    _owners[tokenId] = to;
  }

  function ownerOf(uint256 tokenId) public view returns (address) {
    return _owners[tokenId];
  }

  function balanceOf(address owner) public view returns (uint256) {
    if (owner == address(0)) revert ("Invalid Owner");
    return _balances[owner];
  }

  function _exists(uint256 tokenId) internal view returns (bool) {
    return _owners[tokenId] != address(0);
  }
}