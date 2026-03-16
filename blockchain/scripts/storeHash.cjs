const hre = require("hardhat");

async function main() {

  const CONTRACT_ADDRESS = "0xE539A62F247b53A3B74a112f4d87824BaCE4363D";

  const [signer] = await hre.ethers.getSigners();

  console.log("Using address:", await signer.getAddress());

  const FileStorage = await hre.ethers.getContractFactory("FileStorage");
  const contract = await FileStorage.attach(CONTRACT_ADDRESS);

  const ipfsHash = "QmRrC6THedgdv1aDNM43CbRGeCpyGctV7i1QmeQWjrAjPT";

  const tx = await contract.uploadFile(ipfsHash);
  await tx.wait();

  console.log("Stored hash on blockchain:", ipfsHash);
}

main().catch(console.error);
