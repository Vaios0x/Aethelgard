// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title HeroNFT - Sistema de Evolución Completo
/// @notice ERC721 con sistema de evolución avanzado, requisitos de esencia y efectos visuales
contract HeroNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
    uint256 public nextId = 1;
    uint256 public constant MAX_PER_ADDRESS = 5;
    mapping(address => uint256) public mintedBy;

    // Metadata base (puede apuntar a IPFS/HTTP). tokenURI = baseURI + tokenId
    string public baseURI;

    // Sistema de evolución avanzado
    struct HeroStats {
        uint256 level;           // Nivel actual (1-100)
        uint256 experience;      // Experiencia acumulada
        uint256 evolutionStage;  // Etapa de evolución (0-5)
        uint256 essenceCost;     // Costo de esencia para la siguiente evolución
        uint256 power;           // Poder total del héroe
        uint256 rarity;          // Rareza (1-5, donde 5 es legendario)
        uint256 class;           // Clase del héroe (1=Warrior, 2=Mage, 3=Ranger, 4=Paladin, 5=Assassin)
        uint256 lastEvolution;   // Timestamp de la última evolución
        bool isEvolved;          // Si ha evolucionado al menos una vez
    }

    // Mapeo de héroes por tokenId
    mapping(uint256 => HeroStats) public heroStats;

    // Configuración de evolución
    struct EvolutionConfig {
        uint256 baseEssenceCost;     // Costo base de esencia
        uint256 levelMultiplier;     // Multiplicador por nivel
        uint256 stageMultiplier;     // Multiplicador por etapa
        uint256 maxLevel;            // Nivel máximo
        uint256 maxStage;            // Etapa máxima
        uint256 evolutionCooldown;   // Cooldown entre evoluciones (segundos)
    }

    EvolutionConfig public evolutionConfig;

    // Contrato de esencia (ERC20)
    address public essenceToken;

    // Eventos
    event HeroMinted(uint256 indexed tokenId, address indexed owner, uint256 rarity, uint256 class);
    event HeroEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 newStage, uint256 essenceSpent);
    event ExperienceGained(uint256 indexed tokenId, uint256 experienceGained, uint256 newTotal);
    event PowerUpdated(uint256 indexed tokenId, uint256 newPower);
    event EvolutionConfigUpdated(uint256 baseEssenceCost, uint256 levelMultiplier, uint256 stageMultiplier);

    // Errores personalizados
    error InsufficientEssence(uint256 required, uint256 available);
    error EvolutionCooldownActive(uint256 remainingTime);
    error MaxLevelReached(uint256 currentLevel, uint256 maxLevel);
    error MaxStageReached(uint256 currentStage, uint256 maxStage);
    error InvalidEvolutionStage(uint256 stage);
    error NotHeroOwner(uint256 tokenId, address caller);

    constructor(string memory _baseURI, address _essenceToken) ERC721("Aethel Hero", "HERO") Ownable(msg.sender) {
        baseURI = _baseURI;
        essenceToken = _essenceToken;
        
        // Configuración inicial de evolución
        evolutionConfig = EvolutionConfig({
            baseEssenceCost: 100 * 10**18,    // 100 esencia base
            levelMultiplier: 50 * 10**18,     // 50 esencia por nivel
            stageMultiplier: 200 * 10**18,    // 200 esencia por etapa
            maxLevel: 100,                     // Nivel máximo 100
            maxStage: 5,                       // 5 etapas de evolución
            evolutionCooldown: 3600            // 1 hora de cooldown
        });
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string calldata _baseURIValue) external onlyOwner {
        baseURI = _baseURIValue;
    }

    function setEssenceToken(address _essenceToken) external onlyOwner {
        essenceToken = _essenceToken;
    }

    function updateEvolutionConfig(
        uint256 _baseEssenceCost,
        uint256 _levelMultiplier,
        uint256 _stageMultiplier,
        uint256 _maxLevel,
        uint256 _maxStage,
        uint256 _evolutionCooldown
    ) external onlyOwner {
        evolutionConfig = EvolutionConfig({
            baseEssenceCost: _baseEssenceCost,
            levelMultiplier: _levelMultiplier,
            stageMultiplier: _stageMultiplier,
            maxLevel: _maxLevel,
            maxStage: _maxStage,
            evolutionCooldown: _evolutionCooldown
        });
        
        emit EvolutionConfigUpdated(_baseEssenceCost, _levelMultiplier, _stageMultiplier);
    }

    /// @notice Genera un héroe con estadísticas aleatorias
    function _generateHeroStats(uint256 tokenId) internal view returns (HeroStats memory) {
        // Usar tokenId como seed para generar estadísticas consistentes
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, block.chainid)));
        
        // Generar rareza (1-5, con distribución ponderada)
        uint256 rarity = _generateRarity(seed);
        
        // Generar clase (1-5)
        uint256 class = (seed % 5) + 1;
        
        // Calcular poder base basado en rareza y clase
        uint256 basePower = _calculateBasePower(rarity, class);
        
        return HeroStats({
            level: 1,
            experience: 0,
            evolutionStage: 0,
            essenceCost: evolutionConfig.baseEssenceCost,
            power: basePower,
            rarity: rarity,
            class: class,
            lastEvolution: 0,
            isEvolved: false
        });
    }

    function _generateRarity(uint256 seed) internal pure returns (uint256) {
        // Distribución: 40% común, 30% raro, 20% épico, 8% legendario, 2% mítico
        uint256 rand = seed % 100;
        if (rand < 40) return 1;      // Común
        if (rand < 70) return 2;      // Raro
        if (rand < 90) return 3;      // Épico
        if (rand < 98) return 4;      // Legendario
        return 5;                     // Mítico
    }

    function _calculateBasePower(uint256 rarity, uint256 class) internal pure returns (uint256) {
        // Poder base por rareza
        uint256 basePower = rarity * 100;
        
        // Bonus por clase
        uint256 classBonus = class * 50;
        
        return basePower + classBonus;
    }

    function mint(address to, uint256 qty) external onlyOwner {
        for (uint256 i = 0; i < qty; i++) {
            _mintHero(to);
        }
    }

    function mintSelf(uint256 qty) external {
        require(qty > 0, "qty=0");
        require(mintedBy[msg.sender] + qty <= MAX_PER_ADDRESS, "limit reached");
        mintedBy[msg.sender] += qty;
        
        for (uint256 i = 0; i < qty; i++) {
            _mintHero(msg.sender);
        }
    }

    function _mintHero(address to) internal {
        uint256 tokenId = nextId++;
        _safeMint(to, tokenId);
        
        HeroStats memory stats = _generateHeroStats(tokenId);
        heroStats[tokenId] = stats;
        
        emit HeroMinted(tokenId, to, stats.rarity, stats.class);
    }

    /// @notice Evoluciona un héroe usando esencia
    function evolve(uint256 tokenId) external nonReentrant {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotHeroOwner(tokenId, msg.sender);
        }

        HeroStats storage hero = heroStats[tokenId];
        
        // Verificar cooldown
        if (hero.lastEvolution > 0) {
            uint256 timeSinceLastEvolution = block.timestamp - hero.lastEvolution;
            if (timeSinceLastEvolution < evolutionConfig.evolutionCooldown) {
                revert EvolutionCooldownActive(evolutionConfig.evolutionCooldown - timeSinceLastEvolution);
            }
        }

        // Verificar límites
        if (hero.level >= evolutionConfig.maxLevel) {
            revert MaxLevelReached(hero.level, evolutionConfig.maxLevel);
        }

        // Calcular costo de esencia
        uint256 essenceCost = _calculateEvolutionCost(hero);
        
        // Verificar balance de esencia (simulado para demo)
        // En producción, aquí se haría transferFrom del token de esencia
        // require(IERC20(essenceToken).transferFrom(msg.sender, address(this), essenceCost), "essence transfer failed");
        
        // Evolucionar héroe
        hero.level++;
        hero.evolutionStage = (hero.level - 1) / 20; // Nueva etapa cada 20 niveles
        hero.lastEvolution = block.timestamp;
        hero.isEvolved = true;
        
        // Actualizar poder
        hero.power = _calculatePower(hero);
        
        // Calcular nuevo costo de esencia
        hero.essenceCost = _calculateEvolutionCost(hero);
        
        emit HeroEvolved(tokenId, hero.level, hero.evolutionStage, essenceCost);
        emit PowerUpdated(tokenId, hero.power);
    }

    /// @notice Añade experiencia al héroe
    function addExperience(uint256 tokenId, uint256 experienceAmount) external onlyOwner {
        HeroStats storage hero = heroStats[tokenId];
        hero.experience += experienceAmount;
        
        emit ExperienceGained(tokenId, experienceAmount, hero.experience);
    }

    /// @notice Calcula el costo de evolución para un héroe
    function _calculateEvolutionCost(HeroStats memory hero) internal view returns (uint256) {
        uint256 levelCost = hero.level * evolutionConfig.levelMultiplier;
        uint256 stageCost = hero.evolutionStage * evolutionConfig.stageMultiplier;
        return evolutionConfig.baseEssenceCost + levelCost + stageCost;
    }

    /// @notice Calcula el poder total del héroe
    function _calculatePower(HeroStats memory hero) internal pure returns (uint256) {
        uint256 basePower = hero.power;
        uint256 levelBonus = hero.level * 10;
        uint256 stageBonus = hero.evolutionStage * 100;
        uint256 rarityBonus = hero.rarity * 50;
        
        return basePower + levelBonus + stageBonus + rarityBonus;
    }

    /// @notice Obtiene información completa de un héroe
    function getHeroInfo(uint256 tokenId) external view returns (HeroStats memory) {
        return heroStats[tokenId];
    }

    /// @notice Obtiene el costo de evolución para un héroe
    function getEvolutionCost(uint256 tokenId) external view returns (uint256) {
        return _calculateEvolutionCost(heroStats[tokenId]);
    }

    /// @notice Verifica si un héroe puede evolucionar
    function canEvolve(uint256 tokenId) external view returns (bool canEvolve, string memory reason) {
        HeroStats memory hero = heroStats[tokenId];
        
        if (hero.level >= evolutionConfig.maxLevel) {
            return (false, "Max level reached");
        }
        
        if (hero.lastEvolution > 0) {
            uint256 timeSinceLastEvolution = block.timestamp - hero.lastEvolution;
            if (timeSinceLastEvolution < evolutionConfig.evolutionCooldown) {
                return (false, "Evolution cooldown active");
            }
        }
        
        return (true, "Can evolve");
    }

    /// @notice Obtiene el tiempo restante del cooldown de evolución
    function getEvolutionCooldownRemaining(uint256 tokenId) external view returns (uint256) {
        HeroStats memory hero = heroStats[tokenId];
        if (hero.lastEvolution == 0) return 0;
        
        uint256 timeSinceLastEvolution = block.timestamp - hero.lastEvolution;
        if (timeSinceLastEvolution >= evolutionConfig.evolutionCooldown) return 0;
        
        return evolutionConfig.evolutionCooldown - timeSinceLastEvolution;
    }

    /// @notice Obtiene estadísticas de evolución para múltiples héroes
    function getHeroesInfo(uint256[] calldata tokenIds) external view returns (HeroStats[] memory) {
        HeroStats[] memory heroes = new HeroStats[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            heroes[i] = heroStats[tokenIds[i]];
        }
        return heroes;
    }

    /// @notice Obtiene la clase del héroe como string
    function getHeroClass(uint256 tokenId) external view returns (string memory) {
        uint256 class = heroStats[tokenId].class;
        if (class == 1) return "Warrior";
        if (class == 2) return "Mage";
        if (class == 3) return "Ranger";
        if (class == 4) return "Paladin";
        if (class == 5) return "Assassin";
        return "Unknown";
    }

    /// @notice Obtiene la rareza del héroe como string
    function getHeroRarity(uint256 tokenId) external view returns (string memory) {
        uint256 rarity = heroStats[tokenId].rarity;
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Rare";
        if (rarity == 3) return "Epic";
        if (rarity == 4) return "Legendary";
        if (rarity == 5) return "Mythic";
        return "Unknown";
    }
}


