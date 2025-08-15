// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title EssenceToken - Token de Esencia para Evolución
/// @notice ERC20 token que se usa para evolucionar héroes en el sistema Aethelgard
contract EssenceToken is ERC20, Ownable {
    // Eventos
    event EssenceMinted(address indexed to, uint256 amount);
    event EssenceBurned(address indexed from, uint256 amount);
    event EssenceRewarded(address indexed to, uint256 amount, string reason);

    // Configuración
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens iniciales
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18;    // 10M tokens máximo
    uint256 public constant REWARD_AMOUNT = 100 * 10**18;      // 100 tokens por recompensa

    // Mapeo de direcciones autorizadas para mintear
    mapping(address => bool) public authorizedMinters;

    // Eventos de autorización
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    constructor() ERC20("Aethel Essence", "ESSENCE") Ownable(msg.sender) {
        // Mint inicial al deployer
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @notice Autoriza una dirección para mintear esencia
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /// @notice Revoca la autorización de una dirección
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /// @notice Mintea esencia (solo owner o minters autorizados)
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, amount);
        emit EssenceMinted(to, amount);
    }

    /// @notice Quema esencia
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit EssenceBurned(msg.sender, amount);
    }

    /// @notice Quema esencia desde una dirección específica (solo owner o minters)
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit EssenceBurned(from, amount);
    }

    /// @notice Recompensa esencia por actividades (solo owner o minters)
    function rewardEssence(address to, uint256 amount, string memory reason) external {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, amount);
        emit EssenceRewarded(to, amount, reason);
    }

    /// @notice Recompensa estándar de esencia
    function rewardStandardEssence(address to, string memory reason) external {
        require(msg.sender == owner() || authorizedMinters[msg.sender], "Not authorized");
        require(totalSupply() + REWARD_AMOUNT <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, REWARD_AMOUNT);
        emit EssenceRewarded(to, REWARD_AMOUNT, reason);
    }

    /// @notice Obtiene estadísticas del token
    function getTokenStats() external view returns (
        uint256 totalSupply_,
        uint256 maxSupply,
        uint256 remainingSupply,
        uint256 rewardAmount
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            MAX_SUPPLY - totalSupply(),
            REWARD_AMOUNT
        );
    }

    /// @notice Verifica si una dirección está autorizada para mintear
    function isAuthorizedMinter(address minter) external view returns (bool) {
        return minter == owner() || authorizedMinters[minter];
    }
}
