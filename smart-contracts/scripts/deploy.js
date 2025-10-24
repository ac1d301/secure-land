const { ethers } = require("hardhat");

async function main() {
  console.log("Starting SecureLand contract deployment...");

  // Get the contract factory
  const SecureLand = await ethers.getContractFactory("SecureLand");
  
  // Deploy the contract
  console.log("Deploying SecureLand contract...");
  const secureLand = await SecureLand.deploy();
  
  // Wait for deployment to complete
  await secureLand.waitForDeployment();
  
  const contractAddress = await secureLand.getAddress();
  
  console.log("SecureLand contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Gas Used:", (await secureLand.deploymentTransaction()).gasLimit.toString());
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const owner = await secureLand.owner();
  const isOwnerOfficial = await secureLand.isOfficial(owner);
  
  console.log("Contract Owner:", owner);
  console.log("Owner is Official:", isOwnerOfficial);
  
  // Test basic functionality
  console.log("\nTesting basic functionality...");
  
  try {
    const contractInfo = await secureLand.getContractInfo();
    console.log("Contract Info:", {
      owner: contractInfo.contractOwner,
      address: contractInfo.contractAddress,
      blockNumber: contractInfo.blockNumber.toString()
    });
    
    console.log("Basic functionality test passed!");
  } catch (error) {
    console.error("Basic functionality test failed:", error);
  }
  
  console.log("\nDeployment Summary:");
  console.log("====================");
  console.log("Contract Name: SecureLand");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Deployer:", owner);
  console.log("Deployment Time:", new Date().toISOString());
  
  console.log("\nNext Steps:");
  console.log("1. Copy the contract address to your backend .env file");
  console.log("2. Update CONTRACT_ADDRESS in backend/.env");
  console.log("3. Verify the contract on Etherscan (optional)");
  console.log("4. Test the contract functionality");
  
  // Save deployment info to file
  const deploymentInfo = {
    contractName: "SecureLand",
    contractAddress: contractAddress,
    network: network.name,
    deployer: owner,
    deploymentTime: new Date().toISOString(),
    abi: require("../artifacts/contracts/SecureLand.sol/SecureLand.json").abi
  };
  
  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Deployment info saved to:", deploymentFile);
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
