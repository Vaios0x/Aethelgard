// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Staking de Héroes con recompensas lineales
/// @notice Sistema completo de staking con cálculo de recompensas por tiempo
contract Staking is ERC721Holder, Ownable {
    IERC721 public immutable hero;

    // Economía
    uint256 public rewardPerSecond; // en wei de "esencia" (token virtual para demo)
    uint256 public totalStaked; // Total de tokens staked
    uint256 public lastUpdateTime; // Último tiempo de actualización
    uint256 public rewardPerTokenStored; // Recompensas acumuladas por token

    struct StakeData {
        address owner;
        uint64 since;
        uint256 rewardPerTokenPaid; // Recompensas por token cuando se stakearon
        uint256 rewards; // Recompensas acumuladas
    }

    struct UserInfo {
        uint256[] stakedTokens; // Array de token IDs staked por el usuario
        uint256 totalRewards; // Total de recompensas acumuladas
        uint256 lastClaimTime; // Último tiempo de claim
    }

    mapping(uint256 => StakeData) public stakes; // tokenId => datos
    mapping(address => UserInfo) public userInfo; // user => información del usuario

    event Staked(address indexed user, uint256[] tokenIds);
    event Unstaked(address indexed user, uint256[] tokenIds);
    event Claimed(address indexed user, uint256 amount);
    event RewardsUpdated(uint256 rewardPerToken, uint256 totalStaked);

    constructor(address heroNft, uint256 _rewardPerSecond) Ownable(msg.sender) {
        hero = IERC721(heroNft);
        rewardPerSecond = _rewardPerSecond;
        lastUpdateTime = block.timestamp;
    }

    function setRewardPerSecond(uint256 value) external onlyOwner {
        _updateRewards();
        rewardPerSecond = value;
    }

    /// @notice Actualiza las recompensas globales
    function _updateRewards() internal {
        if (totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            rewardPerTokenStored += (timeElapsed * rewardPerSecond * 1e18) / totalStaked;
        }
        lastUpdateTime = block.timestamp;
    }

    /// @notice Calcula las recompensas pendientes para un token específico
    function _calculateRewards(uint256 tokenId) internal view returns (uint256) {
        StakeData memory stake = stakes[tokenId];
        if (stake.owner == address(0) || stake.since == 0) return 0;

        uint256 currentRewardPerToken = rewardPerTokenStored;
        if (totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            currentRewardPerToken += (timeElapsed * rewardPerSecond * 1e18) / totalStaked;
        }

        uint256 earned = (currentRewardPerToken - stake.rewardPerTokenPaid) / 1e18;
        return stake.rewards + earned;
    }

    /// @notice Actualiza las recompensas para un usuario
    function _updateUserRewards(address user) internal {
        UserInfo storage userData = userInfo[user];
        uint256 totalUserRewards = 0;

        for (uint256 i = 0; i < userData.stakedTokens.length; i++) {
            uint256 tokenId = userData.stakedTokens[i];
            if (stakes[tokenId].owner == user) {
                uint256 tokenRewards = _calculateRewards(tokenId);
                stakes[tokenId].rewards = tokenRewards;
                stakes[tokenId].rewardPerTokenPaid = rewardPerTokenStored;
                totalUserRewards += tokenRewards;
            }
        }

        userData.totalRewards = totalUserRewards;
        userData.lastClaimTime = block.timestamp;
    }

    function isStaked(uint256 tokenId) external view returns (bool) {
        return stakes[tokenId].owner != address(0);
    }

    /// @notice Obtiene todos los tokens staked por un usuario
    function getStakedTokens(address user) external view returns (uint256[] memory) {
        return userInfo[user].stakedTokens;
    }

    /// @notice Stakear tokens
    function stake(uint256[] calldata tokenIds) external {
        _updateRewards();
        _updateUserRewards(msg.sender);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(stakes[id].owner == address(0), "already staked");
            require(hero.ownerOf(id) == msg.sender, "not owner");

            hero.safeTransferFrom(msg.sender, address(this), id);
            
            stakes[id] = StakeData({
                owner: msg.sender,
                since: uint64(block.timestamp),
                rewardPerTokenPaid: rewardPerTokenStored,
                rewards: 0
            });

            userInfo[msg.sender].stakedTokens.push(id);
        }

        totalStaked += tokenIds.length;
        emit Staked(msg.sender, tokenIds);
    }

    /// @notice Des-stakear tokens
    function unstake(uint256[] calldata tokenIds) external {
        _updateRewards();
        _updateUserRewards(msg.sender);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData storage stakeData = stakes[id];
            require(stakeData.owner == msg.sender, "not owner");

            // Remover del array de tokens staked del usuario
            uint256[] storage userTokens = userInfo[msg.sender].stakedTokens;
            for (uint256 j = 0; j < userTokens.length; j++) {
                if (userTokens[j] == id) {
                    userTokens[j] = userTokens[userTokens.length - 1];
                    userTokens.pop();
                    break;
                }
            }

            delete stakes[id];
            hero.safeTransferFrom(address(this), msg.sender, id);
        }

        totalStaked -= tokenIds.length;
        emit Unstaked(msg.sender, tokenIds);
    }

    /// @notice Calcula las recompensas pendientes para un usuario
    function pendingRewards(address user) public view returns (uint256 totalRewards) {
        if (totalStaked == 0) return 0;

        uint256 currentRewardPerToken = rewardPerTokenStored;
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        currentRewardPerToken += (timeElapsed * rewardPerSecond * 1e18) / totalStaked;

        UserInfo memory userData = userInfo[user];
        for (uint256 i = 0; i < userData.stakedTokens.length; i++) {
            uint256 tokenId = userData.stakedTokens[i];
            StakeData memory stakeData = stakes[tokenId];
            
            if (stakeData.owner == user && stakeData.since > 0) {
                uint256 earned = (currentRewardPerToken - stakeData.rewardPerTokenPaid) / 1e18;
                totalRewards += stakeData.rewards + earned;
            }
        }
    }

    /// @notice Calcula las recompensas pendientes para tokens específicos
    function pendingRewardsFor(address user, uint256[] calldata tokenIds) public view returns (uint256 amount) {
        if (totalStaked == 0) return 0;

        uint256 currentRewardPerToken = rewardPerTokenStored;
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        currentRewardPerToken += (timeElapsed * rewardPerSecond * 1e18) / totalStaked;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData memory s = stakes[id];
            if (s.owner == user && s.since > 0) {
                uint256 earned = (currentRewardPerToken - s.rewardPerTokenPaid) / 1e18;
                amount += s.rewards + earned;
            }
        }
    }

    /// @notice Reclamar recompensas
    function claimRewards(uint256[] calldata tokenIds) external {
        _updateRewards();
        _updateUserRewards(msg.sender);

        uint256 totalClaimed = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            StakeData storage s = stakes[id];
            require(s.owner == msg.sender, "not owner");
            require(s.since > 0, "not staked");

            uint256 claimable = s.rewards;
            s.rewards = 0;
            totalClaimed += claimable;
        }

        if (totalClaimed > 0) {
            emit Claimed(msg.sender, totalClaimed);
            // En una versión con token ERC20 real, aquí haríamos transfer/mint
        }
    }

    /// @notice Reclamar todas las recompensas del usuario
    function claimAllRewards() external {
        _updateRewards();
        _updateUserRewards(msg.sender);

        uint256 totalClaimed = userInfo[msg.sender].totalRewards;
        if (totalClaimed > 0) {
            userInfo[msg.sender].totalRewards = 0;
            
            // Resetear recompensas de todos los tokens del usuario
            uint256[] storage userTokens = userInfo[msg.sender].stakedTokens;
            for (uint256 i = 0; i < userTokens.length; i++) {
                uint256 tokenId = userTokens[i];
                if (stakes[tokenId].owner == msg.sender) {
                    stakes[tokenId].rewards = 0;
                }
            }

            emit Claimed(msg.sender, totalClaimed);
        }
    }

    /// @notice Obtiene información completa de staking para un usuario
    function getUserStakingInfo(address user) external view returns (
        uint256[] memory stakedTokens,
        uint256 totalRewards,
        uint256 lastClaimTime,
        uint256 pendingRewardsAmount
    ) {
        UserInfo memory userData = userInfo[user];
        return (
            userData.stakedTokens,
            userData.totalRewards,
            userData.lastClaimTime,
            pendingRewards(user)
        );
    }

    /// @notice Obtiene información de un token staked
    function getStakeInfo(uint256 tokenId) external view returns (
        address owner,
        uint64 since,
        uint256 rewards,
        uint256 pendingRewardsAmount
    ) {
        StakeData memory stakeData = stakes[tokenId];
        return (
            stakeData.owner,
            stakeData.since,
            stakeData.rewards,
            _calculateRewards(tokenId)
        );
    }
}


