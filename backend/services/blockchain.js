const { ethers, formatEther } = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

// Load ABI
const BazuuSaveABI = require('../contracts/BazuuSave.json');

// Setup Provider
let provider;
if (process.env.ALCHEMY_API_URL) {
  provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
} else if (process.env.INFURA_API_URL) {
  provider = new ethers.JsonRpcProvider(process.env.INFURA_API_URL);
} else {
  throw new Error('No Ethereum provider URL configured in .env');
}

// Setup Contract
const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
  throw new Error('CONTRACT_ADDRESS not set in .env');
}

const contract = new ethers.Contract(contractAddress, BazuuSaveABI.abi, provider);

// Polling interval in milliseconds
const POLLING_INTERVAL = 10000; // 10 seconds
const MAX_BLOCK_RANGE = 500; // Maximum block range for eth_getLogs
let lastBlockNumber = 0;

// Helper function to get events in chunks
async function getEventsInChunks(eventFilter, fromBlock, toBlock) {
  const events = [];
  let currentFromBlock = fromBlock;
  
  while (currentFromBlock < toBlock) {
    const currentToBlock = Math.min(currentFromBlock + MAX_BLOCK_RANGE - 1, toBlock);
    try {
      const chunkEvents = await contract.queryFilter(
        eventFilter,
        currentFromBlock,
        currentToBlock
      );
      events.push(...chunkEvents);
    } catch (err) {
      console.error(`Error fetching events from block ${currentFromBlock} to ${currentToBlock}:`, err);
    }
    currentFromBlock = currentToBlock + 1;
  }
  
  return events;
}

// 👂 Setup event polling
async function setupEventPolling() {
  try {
    const currentBlock = await provider.getBlockNumber();
    
    // Only process new blocks
    if (currentBlock > lastBlockNumber) {
      // Calculate the range to query (max 500 blocks)
      const fromBlock = Math.max(lastBlockNumber, currentBlock - MAX_BLOCK_RANGE);
      
      // Get events in chunks
      const depositEvents = await getEventsInChunks(
        contract.filters.Deposited(),
        fromBlock,
        currentBlock
      );
      
      const withdrawalEvents = await getEventsInChunks(
        contract.filters.Withdrawn(),
        fromBlock,
        currentBlock
      );

      // Process deposit events
      for (const event of depositEvents) {
        const { user, amount, timestamp } = event.args;
        console.log(`📥 Deposited: ${user} deposited ${formatEther(amount)} ETH at ${new Date(timestamp * 1000).toISOString()}`);
      }

      // Process withdrawal events
      for (const event of withdrawalEvents) {
        const { user, amount, timestamp } = event.args;
        console.log(`📤 Withdrawn: ${user} withdrew ${formatEther(amount)} ETH at ${new Date(timestamp * 1000).toISOString()}`);
      }

      // Update last processed block
      lastBlockNumber = currentBlock;
    }
  } catch (err) {
    console.error('Error polling events:', err);
  }
}

// Start polling
setInterval(setupEventPolling, POLLING_INTERVAL);

// Exports
module.exports = {
  provider,
  contract,

  // Get user balance
  getBalance: async (address) => {
    try {
      const balance = await contract.balanceOf(address);
      return formatEther(balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      throw err;
    }
  },

  // Get user events (Deposits + Withdrawals)
  getUserEvents: async (address) => {
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - MAX_BLOCK_RANGE);
      
      const deposits = await getEventsInChunks(
        contract.filters.Deposited(address),
        fromBlock,
        currentBlock
      );
      
      const withdrawals = await getEventsInChunks(
        contract.filters.Withdrawn(address),
        fromBlock,
        currentBlock
      );

      const allEvents = [...deposits, ...withdrawals].sort((a, b) => a.blockNumber - b.blockNumber);

      return allEvents.map(event => {
        const { amount, timestamp } = event.args;
        return {
          type: event.event,
          amount: formatEther(amount),
          timestamp: new Date(Number(timestamp) * 1000),
          transactionHash: event.transactionHash
        };
      });
    } catch (err) {
      console.error('Error fetching user events:', err);
      throw err;
    }
  }
};
