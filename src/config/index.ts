import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { StakePoolProgram } from '../service/stakepool-program';

export type ClusterType = 'mainnet-beta' | 'testnet';

const TESTNET_STAKEPOOL_ACCOUNT = 'EEx8JxE1hhpnQw1fLwMY1aLsYdCcphZyrYC3SLSjvx5R';
const MAINNET_STAKEPOOL_ACCOUNT = 'GUAMR8ciiaijraJeLDEDrFVaueLm9YzWWY9R7CBPL9rA';

const TESTNET_STAKEPOOL_PROGRAM_ID = '4uvLNZaB1VpeYZsFnXDw7sLrhuLo3psk3ka5ajWtSGgb';
const MAINNET_STAKEPOOL_PROGRAM_ID = 'EverSFw9uN5t1V8kS3ficHUcKffSjwpGzUSGd7mgmSks';

const USTAKE_IT_POOL_ADDRESS_MAINNET = new PublicKey('FypPtwbY3FUfzJUtXHSyVRokVKG2jKtH29FmK4ebxRSd');
const USTAKE_IT_POOL_ADDRESS_TESTNET = new PublicKey('5Fs8HnjzV5yys8eJwTu5g74cem8s771edtHjgRmXqrqo');
const USTAKE_IT_PROGRAM_ID_MAINNET = new PublicKey('unpXTU2Ndrc7WWNyEhQWe4udTzSibLPi25SXv2xbCHQ');
const USTAKE_IT_PROGRAM_ID_TESTNET = new PublicKey('6KBz9djJAH3gRHscq9ujMpyZ5bCK9a27o3ybDtJLXowz');

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
    const API_ENDPOINT = clusterApiUrl(clusterType);
    this.connection = new Connection(API_ENDPOINT);

    switch (clusterType) {
      case 'testnet':
        this.eSOLStakePoolAddress = new PublicKey(TESTNET_STAKEPOOL_ACCOUNT);
        this.eSOLProgramId = new PublicKey(TESTNET_STAKEPOOL_PROGRAM_ID);
        this.unstakeItPoolAddress = USTAKE_IT_POOL_ADDRESS_MAINNET;
        this.unstakeProgramId = USTAKE_IT_PROGRAM_ID_MAINNET;

        break;
      case 'mainnet-beta':
        this.eSOLStakePoolAddress = new PublicKey(MAINNET_STAKEPOOL_ACCOUNT);
        this.eSOLProgramId = new PublicKey(MAINNET_STAKEPOOL_PROGRAM_ID);
        this.unstakeItPoolAddress = USTAKE_IT_POOL_ADDRESS_TESTNET;
        this.unstakeProgramId = USTAKE_IT_PROGRAM_ID_TESTNET;

        StakePoolProgram.changeProgramId('EverSFw9uN5t1V8kS3ficHUcKffSjwpGzUSGd7mgmSks');
        break;
      default:
        throw new Error('clusterType must be testnet or mainnet-beta');
    }
  }
}
