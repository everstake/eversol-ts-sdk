import { solToLamports } from '../utils';
import { PublicKey } from '@solana/web3.js';

export const TRANSIENT_STAKE_SEED_PREFIX = Buffer.from('transient');
export const TRANSACTION_FEE = 0.000005;
export const RENT_EXEMPTION_FEE = 0.00203928;
export const MIN_AMOUNT_TO_LEAVE_ON_VALIDATOR = solToLamports(0.2);
export const MIN_AMOUNT_TO_WITHDRAW_FROM_VALIDATOR = 1.2;
export const USTAKE_IT_REFERRER_ADDRESS = new PublicKey('DqqdjqPidrSTLgB1JZ6vCuNfnUk21ep3TRmt9qGtFWku');
