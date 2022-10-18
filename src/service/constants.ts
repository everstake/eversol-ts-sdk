import { solToLamports } from '../utils';
import { PublicKey } from '@solana/web3.js';

export const TRANSIENT_STAKE_SEED_PREFIX = Buffer.from('transient');
export const TRANSACTION_FEE = 0.000005;
export const RENT_EXEMPTION_FEE = 0.00203928;
export const MIN_AMOUNT_TO_LEAVE_ON_VALIDATOR = solToLamports(0.2);
export const MIN_AMOUNT_TO_WITHDRAW_FROM_VALIDATOR = 1.2;

export const TESTNET_STAKEPOOL_ACCOUNT = 'EEx8JxE1hhpnQw1fLwMY1aLsYdCcphZyrYC3SLSjvx5R';
export const DEVNET_STAKEPOOL_ACCOUNT = 'J3WCjeAhgzH4DkN2bSLSAC7K1KU5r36ooBJkSMARrNjU';
export const MAINNET_STAKEPOOL_ACCOUNT = 'GUAMR8ciiaijraJeLDEDrFVaueLm9YzWWY9R7CBPL9rA';

export const TESTNET_STAKEPOOL_PROGRAM_ID = '4uvLNZaB1VpeYZsFnXDw7sLrhuLo3psk3ka5ajWtSGgb';
export const DEVNET_STAKEPOOL_PROGRAM_ID = '4uvLNZaB1VpeYZsFnXDw7sLrhuLo3psk3ka5ajWtSGgb';
export const MAINNET_STAKEPOOL_PROGRAM_ID = 'EverSFw9uN5t1V8kS3ficHUcKffSjwpGzUSGd7mgmSks';

export const USTAKE_IT_POOL_ADDRESS_MAINNET = new PublicKey('FypPtwbY3FUfzJUtXHSyVRokVKG2jKtH29FmK4ebxRSd');
export const USTAKE_IT_POOL_ADDRESS_TESTNET = new PublicKey('5Fs8HnjzV5yys8eJwTu5g74cem8s771edtHjgRmXqrqo');
export const USTAKE_IT_POOL_ADDRESS_DEVNET = new PublicKey('379bENbU2p4vY7mPTXcEVdxwP7gNtd8wme7MDy315JrC');

export const USTAKE_IT_PROGRAM_ID_MAINNET = new PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ');
export const USTAKE_IT_PROGRAM_ID_TESTNET = new PublicKey('6KBz9djJAH3gRHscq9ujMpyZ5bCK9a27o3ybDtJLXowz');
export const USTAKE_IT_PROG_ID_DEVNET = new PublicKey('6KBz9djJAH3gRHscq9ujMpyZ5bCK9a27o3ybDtJLXowz');

export const USTAKE_IT_REFERRER_ADDRESS = new PublicKey('DqqdjqPidrSTLgB1JZ6vCuNfnUk21ep3TRmt9qGtFWku');

export const EVERSTAKE_RPC = 'https://solana-mainnet.everstake.one';
export const DEVNET_RPC = 'https://api.devnet.solana.com';
