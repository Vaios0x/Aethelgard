// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title HeroNFT
/// @notice ERC721 enumerables con evolución onchain simple y `mintSelf` para demo/hackathon
contract HeroNFT is ERC721Enumerable, Ownable {
    uint256 public nextId = 1;
    uint256 public constant MAX_PER_ADDRESS = 5;
    mapping(address => uint256) public mintedBy;

    // Metadata base (puede apuntar a IPFS/HTTP). tokenURI = baseURI + tokenId
    string public baseURI;

    // Evolución simple: nivel por tokenId
    mapping(uint256 => uint256) public levelOf;

    event Evolved(uint256 indexed tokenId, uint256 newLevel);

    constructor(string memory _baseURI) ERC721("Aethel Hero", "HERO") Ownable(msg.sender) {
        baseURI = _baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string calldata _baseURIValue) external onlyOwner {
        baseURI = _baseURIValue;
    }

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

    /// @notice Incrementa el nivel del héroe. Restricción mínima: solo el propietario actual
    function evolve(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        unchecked {
            levelOf[tokenId] = levelOf[tokenId] + 1;
        }
        emit Evolved(tokenId, levelOf[tokenId]);
    }
}


