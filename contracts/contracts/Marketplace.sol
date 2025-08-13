// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Marketplace sencillo para héroes (List/Buy/Cancel)
/// @notice Diseño para hackathon: comisión global y soporte de royalties vía EIP-2981 opcional (si se agrega)
contract Marketplace is Ownable {
    struct Listing {
        address seller;
        address nft;
        uint256 tokenId;
        uint256 price; // en wei de CORE
        bool active;
    }

    mapping(bytes32 => Listing) public listings; // key = keccak(nft, tokenId)
    uint256 public feeBps = 250; // 2.5%
    address public feeRecipient;

    event Listed(address indexed seller, address indexed nft, uint256 indexed tokenId, uint256 price);
    event Bought(address indexed buyer, address indexed nft, uint256 indexed tokenId, uint256 price);
    event Canceled(address indexed seller, address indexed nft, uint256 indexed tokenId);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function setFee(uint256 bps, address recipient) external onlyOwner {
        require(bps <= 1000, "fee too high");
        feeBps = bps;
        feeRecipient = recipient;
    }

    function _key(address nft, uint256 tokenId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(nft, tokenId));
    }

    function list(address nft, uint256 tokenId, uint256 price) external {
        require(price > 0, "price=0");
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        listings[_key(nft, tokenId)] = Listing({ seller: msg.sender, nft: nft, tokenId: tokenId, price: price, active: true });
        emit Listed(msg.sender, nft, tokenId, price);
    }

    function cancel(address nft, uint256 tokenId) external {
        bytes32 key = _key(nft, tokenId);
        Listing memory l = listings[key];
        require(l.active, "not listed");
        require(l.seller == msg.sender, "not seller");
        delete listings[key];
        IERC721(nft).transferFrom(address(this), msg.sender, tokenId);
        emit Canceled(msg.sender, nft, tokenId);
    }

    function buy(address nft, uint256 tokenId) external payable {
        bytes32 key = _key(nft, tokenId);
        Listing memory l = listings[key];
        require(l.active, "not listed");
        require(msg.value == l.price, "bad price");
        delete listings[key];
        uint256 fee = (msg.value * feeBps) / 10_000;
        uint256 payout = msg.value - fee;
        if (fee > 0 && feeRecipient != address(0)) {
            (bool okFee, ) = payable(feeRecipient).call{ value: fee }("");
            require(okFee, "fee fail");
        }
        (bool ok, ) = payable(l.seller).call{ value: payout }("");
        require(ok, "pay fail");
        IERC721(nft).transferFrom(address(this), msg.sender, tokenId);
        emit Bought(msg.sender, nft, tokenId, l.price);
    }
}


