// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Staking de Héroes con recompensas lineales
/// @notice Diseño simple para hackathon: APR fijo, periodos en segundos, cálculo lineal por token
contract Staking is ERC721Holder, Ownable {
    IERC721 public immutable hero;

    // Economía
    uint256 public rewardPerSecond; // en wei de "esencia" (token virtual para demo)

    struct StakeData {
        address owner;
        uint64 since;
    }

    mapping(uint256 => StakeData) public stakes; // tokenId => datos

    event Staked(address indexed user, uint256[] tokenIds);
    event Unstaked(address indexed user, uint256[] tokenIds);
    event Claimed(address indexed user, uint256 amount);

    constructor(address heroNft, uint256 _rewardPerSecond) Ownable(msg.sender) {
        hero = IERC721(heroNft);
        rewardPerSecond = _rewardPerSecond;
    }

    function setRewardPerSecond(uint256 value) external onlyOwner {
        rewardPerSecond = value;
    }

    function isStaked(uint256 tokenId) external view returns (bool) {
        return stakes[tokenId].owner != address(0);
    }

    function stake(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(stakes[id].owner == address(0), "already staked");
            hero.safeTransferFrom(msg.sender, address(this), id);
            stakes[id] = StakeData({ owner: msg.sender, since: uint64(block.timestamp) });
        }
        emit Staked(msg.sender, tokenIds);
    }

    function unstake(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData memory s = stakes[id];
            require(s.owner == msg.sender, "not owner");
            delete stakes[id];
            hero.safeTransferFrom(address(this), msg.sender, id);
        }
        emit Unstaked(msg.sender, tokenIds);
    }

    function pendingRewards(address user) public view returns (uint256 amount) {
        // Cálculo naive: itera por tokens del contrato (en demo no será masivo). Para producción, indexar por usuario.
        uint256 supply = 0; // no conocemos supply; recorreremos por eventos offchain en backend en producción
        // Para hackathon, expondremos "claim" por lote aportando los ids; aquí mantenemos interfaz requerida en frontend
        user; supply; // silenciar warnings
        return 0;
    }

    function pendingRewardsFor(address user, uint256[] calldata tokenIds) public view returns (uint256 amount) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData memory s = stakes[id];
            if (s.owner == user && s.since > 0) {
                amount += (block.timestamp - s.since) * rewardPerSecond;
            }
        }
    }

    function claimRewards(uint256[] calldata tokenIds) external {
        uint256 rewards = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData storage s = stakes[id];
            require(s.owner == msg.sender, "not owner");
            require(s.since > 0, "not staked");
            uint256 r = (block.timestamp - s.since) * rewardPerSecond;
            rewards += r;
            s.since = uint64(block.timestamp);
        }
        emit Claimed(msg.sender, rewards);
        // Nota: En una versión con token ERC20 real, aquí haríamos transfer/ mint.
    }
}


