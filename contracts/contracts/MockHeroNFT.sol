// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockHeroNFT is ERC721Enumerable, Ownable {
    uint256 public nextId = 1;
    uint256 public constant MAX_PER_ADDRESS = 1;
    mapping(address => uint256) public mintedBy;

    constructor() ERC721("Aethel Hero", "HERO") Ownable(msg.sender) {}

    function mint(address to, uint256 qty) external onlyOwner {
        for (uint256 i = 0; i < qty; i++) {
            _safeMint(to, nextId++);
        }
    }

    function mintSelf(uint256 qty) external {
        require(qty > 0, "qty=0");
        require(mintedBy[msg.sender] + qty <= MAX_PER_ADDRESS, "limit reached");
        mintedBy[msg.sender] += qty;
        for (uint256 i = 0; i < qty; i++) {
            _safeMint(msg.sender, nextId++);
        }
    }
}


