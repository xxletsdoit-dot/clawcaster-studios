// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title ClawRights
 * @dev ERC-1155 NFT Contract for ClawCaster Studios Film Rights
 * Each film is minted as an NFT with automatic fee splitting
 */
contract ClawRights is ERC1155, Ownable, ERC1155Supply {
    
    struct FilmInfo {
        string title;
        string ipfsHash;
        uint256 createdAt;
        uint256 totalRevenue;
        uint256 streamCount;
        uint256 streamPrice;
    }

    struct FeeRecipient {
        address wallet;
        uint256 percentage;
    }

    mapping(uint256 => FilmInfo) public films;
    mapping(uint256 => FeeRecipient[]) public feeRecipients;
    
    uint256 private _tokenIdCounter;
    uint256 public platformFeePercent = 5;
    address public platformFeeCollector;

    event FilmMinted(
        uint256 indexed tokenId,
        string title,
        string ipfsHash,
        address indexed creator
    );

    event StreamAccess(
        uint256 indexed tokenId,
        address indexed viewer,
        uint256 price
    );

    event FeesDistributed(
        uint256 indexed tokenId,
        uint256 totalAmount
    );

    event RevenueClaimed(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    constructor(
        address _platformFeeCollector,
        address initialOwner
    ) ERC1155("") Ownable(initialOwner) {
        platformFeeCollector = _platformFeeCollector;
    }

    function mintFilm(
        string memory title,
        string memory ipfsHash,
        uint256 streamPrice,
        address[] memory recipientAddresses,
        uint256[] memory percentages
    ) external returns (uint256) {
        require(
            recipientAddresses.length == percentages.length,
            "Recipients and percentages length mismatch"
        );
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            totalPercentage += percentages[i];
        }
        require(
            totalPercentage + platformFeePercent == 100,
            "Fee percentages must sum to 100"
        );

        uint256 tokenId = _tokenIdCounter++;
        
        films[tokenId] = FilmInfo({
            title: title,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            totalRevenue: 0,
            streamCount: 0,
            streamPrice: streamPrice
        });

        for (uint256 i = 0; i < recipientAddresses.length; i++) {
            feeRecipients[tokenId].push(FeeRecipient({
                wallet: recipientAddresses[i],
                percentage: percentages[i]
            }));
        }

        _mint(msg.sender, tokenId, 1, "");

        emit FilmMinted(tokenId, title, ipfsHash, msg.sender);

        return tokenId;
    }

    function streamVideo(uint256 tokenId) external payable {
        require(exists(tokenId), "Token does not exist");
        require(msg.value >= films[tokenId].streamPrice, "Insufficient payment");

        films[tokenId].totalRevenue += msg.value;
        films[tokenId].streamCount++;

        _distributeFees(tokenId, msg.value);

        emit StreamAccess(tokenId, msg.sender, msg.value);
    }

    function _distributeFees(uint256 tokenId, uint256 amount) internal {
        uint256 platformFee = (amount * platformFeePercent) / 100;
        
        (bool success, ) = platformFeeCollector.call{value: platformFee}("");
        require(success, "Platform fee transfer failed");

        uint256 remainingAmount = amount - platformFee;

        FeeRecipient[] storage recipients = feeRecipients[tokenId];
        
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 feeAmount = (remainingAmount * recipients[i].percentage) / 100;
            (bool recipientSuccess, ) = recipients[i].wallet.call{value: feeAmount}("");
            require(recipientSuccess, "Fee distribution failed");
        }

        emit FeesDistributed(tokenId, amount);
    }

    function getFilmInfo(uint256 tokenId) external view returns (
        string memory title,
        string memory ipfsHash,
        uint256 createdAt,
        uint256 totalRevenue,
        uint256 streamCount,
        uint256 streamPrice
    ) {
        require(exists(tokenId), "Token does not exist");
        FilmInfo storage film = films[tokenId];
        return (
            film.title,
            film.ipfsHash,
            film.createdAt,
            film.totalRevenue,
            film.streamCount,
            film.streamPrice
        );
    }

    function getFeeRecipients(uint256 tokenId) external view returns (
        address[] memory wallets,
        uint256[] memory percentages
    ) {
        require(exists(tokenId), "Token does not exist");
        
        FeeRecipient[] storage recipients = feeRecipients[tokenId];
        wallets = new address[](recipients.length);
        percentages = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            wallets[i] = recipients[i].wallet;
            percentages[i] = recipients[i].percentage;
        }
        
        return (wallets, percentages);
    }

    function setStreamPrice(uint256 tokenId, uint256 newPrice) external {
        require(
            balanceOf(msg.sender, tokenId) > 0 || owner() == msg.sender,
            "Not authorized"
        );
        films[tokenId].streamPrice = newPrice;
    }

    function setPlatformFeePercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 20, "Platform fee too high");
        platformFeePercent = newPercent;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "Token does not exist");
        return string(abi.encodePacked("ipfs://", films[tokenId].ipfsHash));
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return totalSupply(tokenId) > 0;
    }
}
