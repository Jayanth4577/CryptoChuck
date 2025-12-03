// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserRegistry
 * @dev Tracks registered users to prevent duplicate registrations
 */
contract UserRegistry is Ownable {
    
    struct UserInfo {
        bool isRegistered;
        uint256 registrationTime;
        uint256 hensReceived;
        string email; // Optional, can be empty
    }
    
    mapping(address => UserInfo) public users;
    mapping(string => bool) public emailUsed; // Prevent email reuse
    
    uint256 public totalRegistrations;
    uint256 public constant MAX_FREE_HENS = 2;
    
    // Events
    event UserRegistered(address indexed user, string email, uint256 timestamp);
    event RegistrationRevoked(address indexed user);
    
    constructor() {}
    
    /**
     * @dev Register a new user
     * @param user Address of the user to register
     * @param email Optional email (can be empty string)
     */
    function registerUser(address user, string memory email) external onlyOwner {
        require(!users[user].isRegistered, "User already registered");
        require(user != address(0), "Invalid user address");
        
        // Check email if provided
        if (bytes(email).length > 0) {
            require(!emailUsed[email], "Email already used");
            emailUsed[email] = true;
        }
        
        users[user] = UserInfo({
            isRegistered: true,
            registrationTime: block.timestamp,
            hensReceived: MAX_FREE_HENS,
            email: email
        });
        
        totalRegistrations++;
        
        emit UserRegistered(user, email, block.timestamp);
    }
    
    /**
     * @dev Check if user is registered
     */
    function isRegistered(address user) external view returns (bool) {
        return users[user].isRegistered;
    }
    
    /**
     * @dev Get user registration info
     */
    function getUserInfo(address user) external view returns (UserInfo memory) {
        return users[user];
    }
    
    /**
     * @dev Revoke registration (emergency only)
     */
    function revokeRegistration(address user) external onlyOwner {
        require(users[user].isRegistered, "User not registered");
        
        // Free up email if it was used
        if (bytes(users[user].email).length > 0) {
            emailUsed[users[user].email] = false;
        }
        
        delete users[user];
        totalRegistrations--;
        
        emit RegistrationRevoked(user);
    }
    
    /**
     * @dev Batch check registrations
     */
    function areRegistered(address[] memory addresses) external view returns (bool[] memory) {
        bool[] memory results = new bool[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            results[i] = users[addresses[i]].isRegistered;
        }
        return results;
    }
}
