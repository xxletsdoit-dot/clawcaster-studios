import { ethers } from 'ethers'
import IClawRights from '../contracts/interfaces/IClawRights.sol'

const CLAW_RIGHTS_ABI = [
  "function mintFilm(string title, string ipfsHash, uint256 streamPrice, address[] recipientAddresses, uint256[] percentages) returns (uint256)",
  "function streamVideo(uint256 tokenId) payable",
  "function getFilmInfo(uint256 tokenId) view returns (string title, string ipfsHash, uint256 createdAt, uint256 totalRevenue, uint256 streamCount, uint256 streamPrice)",
  "function getFeeRecipients(uint256 tokenId) view returns (address[] wallets, uint256[] percentages)",
  "function setStreamPrice(uint256 tokenId, uint256 newPrice)",
  "function uri(uint256 tokenId) view returns (string)",
  "function exists(uint256 tokenId) view returns (bool)",
  "event FilmMinted(uint256 indexed tokenId, string title, string ipfsHash, address indexed creator)",
  "event StreamAccess(uint256 indexed tokenId, address indexed viewer, uint256 price)",
  "event FeesDistributed(uint256 indexed tokenId, uint256 totalAmount)",
]

const CLAW_RIGHTS_BYTECODE = ''

export interface DeployConfig {
  rpcUrl: string
  privateKey: string
  platformFeeCollector: string
}

export interface MintFilmParams {
  title: string
  ipfsHash: string
  streamPrice: string
  recipientAddresses: string[]
  percentages: number[]
}

export async function deployClawRights(
  config: DeployConfig
): Promise<{ contractAddress: string; transactionHash: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(config.privateKey, provider)

  const factory = new ethers.ContractFactory(
    CLAW_RIGHTS_ABI,
    CLAW_RIGHTS_BYTECODE,
    wallet
  )

  const contract = await factory.deploy(
    config.platformFeeCollector,
    wallet.address
  )

  await contract.waitForDeployment()

  return {
    contractAddress: await contract.getAddress(),
    transactionHash: contract.deploymentTransaction()?.hash || '',
  }
}

export function getClawRightsContract(
  contractAddress: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(contractAddress, CLAW_RIGHTS_ABI, signerOrProvider)
}

export async function mintFilm(
  contractAddress: string,
  signer: ethers.Signer,
  params: MintFilmParams
): Promise<{ tokenId: bigint; transactionHash: string }> {
  const contract = getClawRightsContract(contractAddress, signer)

  const tx = await contract.mintFilm(
    params.title,
    params.ipfsHash,
    ethers.parseEther(params.streamPrice),
    params.recipientAddresses,
    params.percentages
  )

  const receipt = await tx.wait()

  const event = receipt?.logs.find(
    (log: { topics: string[] }) => log.topics[0] === ethers.id("FilmMinted(uint256,string,string,address)")
  )

  const tokenId = event ? ethers.getBigInt(event.topics[1]) : BigInt(0)

  return {
    tokenId,
    transactionHash: tx.hash,
  }
}

export async function getFilmInfo(
  contractAddress: string,
  provider: ethers.Provider,
  tokenId: bigint
): Promise<{
  title: string
  ipfsHash: string
  createdAt: bigint
  totalRevenue: bigint
  streamCount: bigint
  streamPrice: bigint
}> {
  const contract = getClawRightsContract(contractAddress, provider)
  return await contract.getFilmInfo(tokenId)
}

export { CLAW_RIGHTS_ABI }
