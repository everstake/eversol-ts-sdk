import { ESolConfig, ClusterType } from './config';
import { PublicKey, Transaction } from '@solana/web3.js';
export declare class ESol {
    readonly config: ESolConfig;
    constructor(clusterType?: ClusterType);
    depositSolTransaction(userAddress: PublicKey, lamports: number, referrerAccount: PublicKey, poolTokenReceiverAccount?: PublicKey, daoCommunityTokenReceiverAccount?: PublicKey, referrerTokenAccount?: PublicKey): Promise<Transaction>;
    unDelegateSolTransaction(userAddress: PublicKey, eSolAmount: number, solWithdrawAuthority?: PublicKey): Promise<Transaction>;
    withdrawSolTransaction(userAddress: PublicKey, eSolAmount: number, stakeReceiver?: PublicKey, poolTokenAccount?: PublicKey): Promise<Transaction>;
}
