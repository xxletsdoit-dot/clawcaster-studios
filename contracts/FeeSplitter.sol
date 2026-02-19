// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeSplitter
 * @dev Abstract contract for fee splitting functionality
 * Can be integrated with Bankr's fee splitting infrastructure
 */
abstract contract FeeSplitter {
    
    struct SplitInfo {
        address recipient;
        uint256 percentage;
        uint256 accumulated;
    }

    mapping(bytes32 => SplitInfo[]) public splits;
    mapping(bytes32 => uint256) public totalAccumulated;

    event SplitCreated(
        bytes32 indexed splitId,
        address[] recipients,
        uint256[] percentages
    );

    event SplitDistributed(
        bytes32 indexed splitId,
        uint256 totalAmount
    );

    modifier validSplit(
        address[] memory recipients,
        uint256[] memory percentages
    ) {
        require(
            recipients.length == percentages.length,
            "Arrays length mismatch"
        );
        
        uint256 total = 0;
        for (uint256 i = 0; i < percentages.length; i++) {
            total += percentages[i];
        }
        require(total == 100, "Percentages must sum to 100");
        _;
    }

    function _createSplit(
        bytes32 splitId,
        address[] memory recipients,
        uint256[] memory percentages
    ) internal validSplit(recipients, percentages) {
        for (uint256 i = 0; i < recipients.length; i++) {
            splits[splitId].push(SplitInfo({
                recipient: recipients[i],
                percentage: percentages[i],
                accumulated: 0
            }));
        }

        emit SplitCreated(splitId, recipients, percentages);
    }

    function _addToSplit(bytes32 splitId, uint256 amount) internal {
        totalAccumulated[splitId] += amount;
        
        for (uint256 i = 0; i < splits[splitId].length; i++) {
            uint256 share = (amount * splits[splitId][i].percentage) / 100;
            splits[splitId][i].accumulated += share;
        }
    }

    function _distributeSplit(bytes32 splitId) internal {
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < splits[splitId].length; i++) {
            uint256 amount = splits[splitId][i].accumulated;
            if (amount > 0) {
                (bool success, ) = splits[splitId][i].recipient.call{value: amount}("");
                require(success, "Distribution failed");
                totalDistributed += amount;
                splits[splitId][i].accumulated = 0;
            }
        }

        if (totalDistributed > 0) {
            totalAccumulated[splitId] = 0;
            emit SplitDistributed(splitId, totalDistributed);
        }
    }

    function getSplitInfo(bytes32 splitId) external view returns (
        address[] memory recipients,
        uint256[] memory percentages,
        uint256[] memory accumulated
    ) {
        SplitInfo[] storage splitData = splits[splitId];
        
        recipients = new address[](splitData.length);
        percentages = new uint256[](splitData.length);
        accumulated = new uint256[](splitData.length);
        
        for (uint256 i = 0; i < splitData.length; i++) {
            recipients[i] = splitData[i].recipient;
            percentages[i] = splitData[i].percentage;
            accumulated[i] = splitData[i].accumulated;
        }
        
        return (recipients, percentages, accumulated);
    }
}
