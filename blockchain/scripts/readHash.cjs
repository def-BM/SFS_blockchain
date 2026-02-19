const hre = require("hardhat");

async function main() {

  const CONTRACT_ADDRESS = "0xE539A62F247b53A3B74a112f4d87824BaCE4363D";

  const [signer] = await hre.ethers.getSigners();

  const FileStorage = await hre.ethers.getContractFactory("FileStorage");
  const contract = await FileStorage.attach(CONTRACT_ADDRESS);

  const hash = await contract.getLatestHash();

  console.log("Latest IPFS Hash:", hash);
}

main().catch(console.error);
