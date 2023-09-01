// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.9.0;

import "./Token.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @dev ERC721
 */
contract TokenNFT is Token, ERC721 {

  constructor (string memory _name, string memory _symbol) Token(_name, _symbol) ERC721(_name, _symbol) {}

  function name() public view override(ERC721, Token) returns (string memory) {
    return super.name();
  }

  function symbol() public view override(ERC721, Token) returns (string memory) {
    return super.symbol();
  }

  function approve(address to, uint256 tokenId) public override(ERC721, Token){
    ERC721.approve(to, tokenId);
  }

  function isApproved(address to, uint256 tokenId) public view override returns (bool) {
    address owner = ownerOf(tokenId);
    if (to == owner) revert ("TokenNFT.approved: Invalid Operator");
    return ERC721.getApproved(tokenId) == to;
  }

  function transfer(address from, address to, uint256 tokenId) public override returns (bool) {
    ERC721.transferFrom(from, to, tokenId);
    return true;
  }

  /// @dev create a token for address to
  /// @param to account address
  /// @param tokenId token ID
  function mint(address to, uint256 tokenId) public override {
    // if (_exists(tokenId)) revert("Mint: Token ID exists");
    // if (to == address(0)) revert("Mint: Invalid receiver address");
    // _balances[to] += 1;
    // _owners[tokenId] = to;
    ERC721._mint(to, tokenId);
  }

  function ownerOf(uint256 tokenId) public view override returns (address) {
    // return _owners[tokenId];
    return ERC721.ownerOf(tokenId);
  }

  function balanceOf(address owner) public view override returns (uint256) {
  //   if (owner == address(0)) revert ("Invalid Owner");
  //   return _balances[owner];
    return ERC721.balanceOf(owner);
  }

  function _exists(uint256 tokenId) internal view override returns (bool) {
    // return _owners[tokenId] != address(0);
    return ERC721._exists(tokenId);
  }
}

contract NFTFactory {
  address[] _tokens;

  function createNFT(string memory name, string memory symbol) public {
    TokenNFT token = new TokenNFT(name, symbol);
    _tokens.push(address(token));
  }

  function getTokens() public view returns (address[] memory) {
    return _tokens;
  }
}