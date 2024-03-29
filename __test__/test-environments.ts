import { PublicKey, Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { solToLamports, lamportsToSol } from '../src/utils';
import { Provider, Wallet } from '@project-serum/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { getTokenAccount, StakePoolAccount } from '../src/service/service';

export const NETWORK_TYPE = 'testnet'; // you can change it for 'mainnet-beta or devnet'
const API_ENDPOINT = clusterApiUrl(NETWORK_TYPE);

export const CONNECTION = new Connection(API_ENDPOINT);
export const TESTNET_STAKEPOOL_ACCOUNT = 'w55eR1rNUjD1hLxvxsVtBDm98iPdSWTbLmTh8B1WA4k';

export const USER_SDK = Keypair.fromSecretKey(
  new Uint8Array([
    205, 48, 62, 156, 118, 87, 134, 117, 108, 70, 163, 168, 63, 59, 198, 83, 105, 29, 241, 56, 83, 113, 118, 236, 12,
    154, 56, 154, 87, 67, 14, 189, 9, 187, 32, 80, 178, 86, 77, 136, 28, 225, 6, 103, 224, 27, 234, 9, 151, 86, 45, 165,
    148, 19, 8, 138, 103, 51, 209, 48, 91, 162, 191, 168,
  ]),
);
export const referrerAccount = new PublicKey('Dy4HN6gtzZBEpNYZvRZvsKRn9KSDdyYWu2LgqUr24Fjm');
export const REFERRING_ACCOUNTS_LIST = ['Dy4HN6gtzZBEpNYZvRZvsKRn9KSDdyYWu2LgqUr24Fjm'];
export const PROVIDER = new Provider(CONNECTION, new Wallet(USER_SDK), { commitment: 'confirmed' });
export const TESTING_LAMPORTS_AMOUNT = solToLamports(2);

export const sendLamportsToTestingWallet = async (account: PublicKey) => {
  let userBalance = await CONNECTION.getBalance(account, 'confirmed');

  while (lamportsToSol(userBalance) < 1.9) {
    const signature = await CONNECTION.requestAirdrop(account, LAMPORTS_PER_SOL);
    await CONNECTION.confirmTransaction(signature, 'finalized');
    userBalance = await CONNECTION.getBalance(account, 'finalized');
  }
};

export const getESolBalance = async (stakePool: StakePoolAccount, userPubkey: PublicKey) => {
  const poolTokenAccount = await getAssociatedTokenAddress(
    stakePool.account.data.poolMint,
    userPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const tokenAccount = await getTokenAccount(CONNECTION, poolTokenAccount, stakePool.account.data.poolMint);
  return tokenAccount.amount.toNumber();
};
