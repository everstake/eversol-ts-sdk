import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { StakePoolProgram } from '../service/stakepool-program';

import {
  TESTNET_STAKEPOOL_ACCOUNT,
  MAINNET_STAKEPOOL_ACCOUNT,
  TESTNET_STAKEPOOL_PROGRAM_ID,
  MAINNET_STAKEPOOL_PROGRAM_ID,
  USTAKE_IT_POOL_ADDRESS_MAINNET,
  USTAKE_IT_POOL_ADDRESS_TESTNET,
  USTAKE_IT_PROGRAM_ID_MAINNET,
  USTAKE_IT_PROGRAM_ID_TESTNET,
  DEVNET_STAKEPOOL_ACCOUNT,
  DEVNET_STAKEPOOL_PROGRAM_ID,
  USTAKE_IT_POOL_ADDRESS_DEVNET,
  USTAKE_IT_PROG_ID_DEVNET,
  EVERSTAKE_RPC,
  DEVNET_RPC,
} from '../service/constants';

export type ClusterType = 'mainnet-beta' | 'testnet' | 'devnet';

export class ESolConfig {
  eSOLProgramId: PublicKey;
  eSOLStakePoolAddress: PublicKey;
  unstakeItPoolAddress: PublicKey;
  unstakeProgramId: PublicKey;
  seedPrefixDaoState = 'dao_state';
  seedPrefixCommunityToken = 'community_token';
  seedPrefixCommunityTokenStakingRewards = 'c_t_staking_rewards';
  seedPrefixCommunityTokenStakingRewardsCounter = 'c_t_staking_rewards_counter';

  referrerListPrefix = 'referrer_list';
  metricCounterPrefix = 'metrics_deposit_referrer_counter';
  metricPrefix = 'metric_deposit_referrer';

  connection: any;
  publicKey: PublicKey | null = null;

  constructor(clusterType: ClusterType) {
    switch (clusterType) {
      case 'testnet':
        this.eSOLStakePoolAddress = new PublicKey(TESTNET_STAKEPOOL_ACCOUNT);
        this.eSOLProgramId = new PublicKey(TESTNET_STAKEPOOL_PROGRAM_ID);
        this.unstakeItPoolAddress = USTAKE_IT_POOL_ADDRESS_TESTNET;
        this.unstakeProgramId = USTAKE_IT_PROGRAM_ID_TESTNET;
        this.connection = new Connection(clusterApiUrl('testnet'));

        break;

      case 'devnet':
        this.eSOLStakePoolAddress = new PublicKey(DEVNET_STAKEPOOL_ACCOUNT);
        this.eSOLProgramId = new PublicKey(DEVNET_STAKEPOOL_PROGRAM_ID);
        this.unstakeItPoolAddress = USTAKE_IT_POOL_ADDRESS_DEVNET;
        this.unstakeProgramId = USTAKE_IT_PROG_ID_DEVNET;
        this.connection = new Connection(DEVNET_RPC);

        break;
      case 'mainnet-beta':
        this.eSOLStakePoolAddress = new PublicKey(MAINNET_STAKEPOOL_ACCOUNT);
        this.eSOLProgramId = new PublicKey(MAINNET_STAKEPOOL_PROGRAM_ID);
        this.unstakeItPoolAddress = USTAKE_IT_POOL_ADDRESS_MAINNET;
        this.unstakeProgramId = USTAKE_IT_PROGRAM_ID_MAINNET;
        this.connection = new Connection(EVERSTAKE_RPC);

        StakePoolProgram.changeProgramId('EverSFw9uN5t1V8kS3ficHUcKffSjwpGzUSGd7mgmSks');
        break;
      default:
        throw new Error('clusterType must be testnet or mainnet-beta');
    }
  }
}
