import { PublicKey, Transaction } from '@solana/web3.js';
import { ESolConfig, ClusterType } from './config';
export declare class ESol {
    readonly config: ESolConfig;
    constructor(clusterType?: ClusterType);
    createDepositSolTransactionWithReferrer(walletAddress: PublicKey, lamports: number, referrerAccount: PublicKey, poolTokenReceiverAccount?: PublicKey, daoCommunityTokenReceiverAccount?: PublicKey): Promise<Transaction>;
    createUnDelegateSolTransaction(userAddress: PublicKey, eSolAmount: number, solWithdrawAuthority?: PublicKey): Promise<Transaction>;
    createWithdrawSolTransaction(userAddress: PublicKey, eSolAmount: number, stakeReceiver?: PublicKey, poolTokenAccount?: PublicKey): Promise<Transaction>;
}
