// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockStaking is Ownable {
    IERC721 public immutable hero;
    mapping(uint256 => bool) public isStaked;

    event Staked(address indexed user, uint256[] ids);
    event Unstaked(address indexed user, uint256[] ids);

    constructor(address heroNft) Ownable(msg.sender) {
        hero = IERC721(heroNft);
    }

    function stake(uint256[] calldata ids) external {
        for (uint256 i = 0; i < ids.length; i++) {
            hero.transferFrom(msg.sender, address(this), ids[i]);
            isStaked[ids[i]] = true;
        }
        emit Staked(msg.sender, ids);
    }

    function unstake(uint256[] calldata ids) external onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            require(isStaked[ids[i]], "not staked");
            isStaked[ids[i]] = false;
            hero.transferFrom(address(this), msg.sender, ids[i]);
        }
        emit Unstaked(msg.sender, ids);
    }
}


