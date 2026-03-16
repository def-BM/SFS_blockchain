// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileStorage {

    struct File {
        string ipfsHash;
        address owner;
        uint256 timestamp;
    }

    mapping(address => File[]) private userFiles;

    function uploadFile(string memory _ipfsHash) public {
        userFiles[msg.sender].push(
            File(_ipfsHash, msg.sender, block.timestamp)
        );
    }

    // SIMPLE getter
    function getLatestHash() public view returns (string memory) {
        uint len = userFiles[msg.sender].length;
        require(len > 0, "No files");
        return userFiles[msg.sender][len - 1].ipfsHash;
    }
}
