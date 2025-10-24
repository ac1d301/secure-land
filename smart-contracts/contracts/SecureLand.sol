// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureLand
 * @dev A smart contract for secure land document verification and management
 * @author Secure Land Team
 */
contract SecureLand {
    // Events
    event DocumentRecorded(string indexed documentId, bytes32 indexed hash, address indexed recorder, uint256 timestamp);
    event DocumentVerified(string indexed documentId, bytes32 indexed hash, address indexed verifier, uint256 timestamp);
    event OfficialAdded(address indexed official, address indexed addedBy, uint256 timestamp);
    event OfficialRemoved(address indexed official, address indexed removedBy, uint256 timestamp);

    // State variables
    address public owner;
    mapping(string => bytes32) public documentHashes;
    mapping(string => bool) public documentExists;
    mapping(string => uint256) public documentTimestamps;
    mapping(string => address) public documentRecorders;
    mapping(address => bool) public officials;
    mapping(address => bool) public authorizedUsers;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyOfficial() {
        require(officials[msg.sender] || msg.sender == owner, "Only officials can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender] || officials[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        officials[msg.sender] = true;
        authorizedUsers[msg.sender] = true;
    }

    /**
     * @dev Record a document hash on the blockchain
     * @param documentId The unique identifier for the document
     * @param hash The SHA-256 hash of the document content
     */
    function recordDocumentHash(string memory documentId, bytes32 hash) public onlyOfficial {
        require(!documentExists[documentId], "Document already exists");
        require(hash != bytes32(0), "Invalid hash");
        
        documentHashes[documentId] = hash;
        documentExists[documentId] = true;
        documentTimestamps[documentId] = block.timestamp;
        documentRecorders[documentId] = msg.sender;
        
        emit DocumentRecorded(documentId, hash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify if a document hash matches the stored hash
     * @param documentId The unique identifier for the document
     * @param hash The hash to verify
     * @return True if the hash matches, false otherwise
     */
    function verifyDocumentHash(string memory documentId, bytes32 hash) public view returns (bool) {
        require(documentExists[documentId], "Document does not exist");
        return documentHashes[documentId] == hash;
    }

    /**
     * @dev Get the stored hash for a document
     * @param documentId The unique identifier for the document
     * @return The stored hash
     */
    function getDocumentHash(string memory documentId) public view returns (bytes32) {
        require(documentExists[documentId], "Document does not exist");
        return documentHashes[documentId];
    }

    /**
     * @dev Check if a document exists
     * @param documentId The unique identifier for the document
     * @return True if the document exists, false otherwise
     */
    function documentExistsCheck(string memory documentId) public view returns (bool) {
        return documentExists[documentId];
    }

    /**
     * @dev Get document metadata
     * @param documentId The unique identifier for the document
     * @return hash The stored hash
     * @return timestamp When the document was recorded
     * @return recorder Who recorded the document
     */
    function getDocumentMetadata(string memory documentId) public view returns (bytes32 hash, uint256 timestamp, address recorder) {
        require(documentExists[documentId], "Document does not exist");
        return (documentHashes[documentId], documentTimestamps[documentId], documentRecorders[documentId]);
    }

    /**
     * @dev Add an official to the system
     * @param official The address of the official to add
     */
    function addOfficial(address official) public onlyOwner {
        require(official != address(0), "Invalid address");
        require(!officials[official], "Already an official");
        
        officials[official] = true;
        authorizedUsers[official] = true;
        
        emit OfficialAdded(official, msg.sender, block.timestamp);
    }

    /**
     * @dev Remove an official from the system
     * @param official The address of the official to remove
     */
    function removeOfficial(address official) public onlyOwner {
        require(official != address(0), "Invalid address");
        require(officials[official], "Not an official");
        require(official != owner, "Cannot remove owner");
        
        officials[official] = false;
        authorizedUsers[official] = false;
        
        emit OfficialRemoved(official, msg.sender, block.timestamp);
    }

    /**
     * @dev Add an authorized user
     * @param user The address of the user to authorize
     */
    function addAuthorizedUser(address user) public onlyOwner {
        require(user != address(0), "Invalid address");
        authorizedUsers[user] = true;
    }

    /**
     * @dev Remove an authorized user
     * @param user The address of the user to remove authorization
     */
    function removeAuthorizedUser(address user) public onlyOwner {
        require(user != address(0), "Invalid address");
        authorizedUsers[user] = false;
    }

    /**
     * @dev Check if an address is an official
     * @param user The address to check
     * @return True if the address is an official, false otherwise
     */
    function isOfficial(address user) public view returns (bool) {
        return officials[user];
    }

    /**
     * @dev Check if an address is authorized
     * @param user The address to check
     * @return True if the address is authorized, false otherwise
     */
    function isAuthorized(address user) public view returns (bool) {
        return authorizedUsers[user];
    }

    /**
     * @dev Get the total number of documents recorded
     * @return The number of documents
     */
    function getTotalDocuments() public view returns (uint256) {
        // This would require tracking document count, but for simplicity we'll return 0
        // In a production contract, you'd maintain a counter
        return 0;
    }

    /**
     * @dev Transfer ownership of the contract
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already the owner");
        
        address oldOwner = owner;
        owner = newOwner;
        officials[newOwner] = true;
        authorizedUsers[newOwner] = true;
        
        emit OfficialAdded(newOwner, oldOwner, block.timestamp);
    }

    /**
     * @dev Emergency function to pause the contract (if needed)
     * This is a placeholder - in production you'd implement a Pausable contract
     */
    function emergencyPause() public onlyOwner {
        // Implementation would pause all non-essential functions
        // This is a placeholder for emergency situations
    }

    /**
     * @dev Get contract information
     * @return contractOwner The owner of the contract
     * @return contractAddress The address of this contract
     * @return blockNumber The current block number
     */
    function getContractInfo() public view returns (address contractOwner, address contractAddress, uint256 blockNumber) {
        return (owner, address(this), block.number);
    }
}
