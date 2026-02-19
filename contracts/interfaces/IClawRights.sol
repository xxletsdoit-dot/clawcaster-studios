// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClawRights
 * @dev Interface for ClawRights NFT Contract
 */
interface IClawRights {
    
    struct FilmInfo {
        string title;
        string ipfsHash;
        uint256 createdAt;
        uint256 totalRevenue;
        uint256 streamCount;
        uint256 streamPrice;
    }

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

    function mintFilm(
        string calldata title,
        string calldata ipfsHash,
        uint256 streamPrice,
        address[] calldata recipientAddresses,
        uint256[] calldata percentages
    ) external returns (uint256 tokenId);

    function streamVideo(uint256 tokenId) external payable;

    function getFilmInfo(uint256 tokenId) external view returns (
        string memory title,
        string memory ipfsHash,
        uint256 createdAt,
        uint256 totalRevenue,
        uint256 streamCount,
        uint256 streamPrice
    );

    function getFeeRecipients(uint256 tokenId) external view returns (
        address[] memory wallets,
        uint256[] memory percentages
    );

    function setStreamPrice(uint256 tokenId, uint256 newPrice) external;

    function uri(uint256 tokenId) external view returns (string memory);

    function exists(uint256 tokenId) external view returns (bool);
}
