import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { solToLamports, lamportsToSol } from '../src/utils';
import BN from 'bn.js';

export const NETWORK_TYPE = 'testnet'; // you can change it for 'mainnet-beta'
const API_ENDPOINT = clusterApiUrl(NETWORK_TYPE);
export const CONNECTION = new Connection(API_ENDPOINT);

export const TESTING_LAMPORTS_AMOUNT = solToLamports(2);

export const sendLamportsToTestingWallet = async (account: PublicKey, minimumLamportsBalance: number) => {
  const signature = await CONNECTION.requestAirdrop(account, minimumLamportsBalance);
  await CONNECTION.confirmTransaction(signature);
  console.log('Airdrop:', lamportsToSol(new BN(minimumLamportsBalance)), 'SOL', 'to', account.toString());
};
