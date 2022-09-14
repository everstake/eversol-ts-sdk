import { PublicKey } from '@solana/web3.js';

import { StakePoolProgram } from './stakepool-program';

async function checkCommunityTokenStakingAccount(
  stakePoolAddress: PublicKey,
  connection: any,
  walletAddress: PublicKey,
  seedPrefixCommunityTokenStakingRewards: string,
  seedPrefixCommunityTokenStakingRewardsCounter: string,
) {
  // communityTokenStakingRewardsCounter
  // CommunityTokenStakingRewards
  // Account Data length = 105 bytes
  // 0.00173304
  const communityTokenStakingRewardsCounterDtoInfo = await PublicKey.findProgramAddress(
    [
      Buffer.from(seedPrefixCommunityTokenStakingRewardsCounter),
      stakePoolAddress.toBuffer(),
      StakePoolProgram.programId.toBuffer(),
    ],
    StakePoolProgram.programId,
  );
  const communityStakingRewardsCounterPubkey = communityTokenStakingRewardsCounterDtoInfo[0];
  const communityTokenStakingRewardsCounterAccount = await connection.getAccountInfo(
    communityStakingRewardsCounterPubkey,
  );

  if (!communityTokenStakingRewardsCounterAccount) {
    throw Error('Community token staking reward counter is not exist'); // if isDaoEnabled -> error should NOT happened
  }

  const communityTokenStakingRewardsInfo = await PublicKey.findProgramAddress(
    [
      Buffer.from(seedPrefixCommunityTokenStakingRewards),
      stakePoolAddress.toBuffer(),
      walletAddress.toBuffer(),
      StakePoolProgram.programId.toBuffer(),
    ],
    StakePoolProgram.programId,
  );
  const communityTokenStakingRewardsPubkey: any = communityTokenStakingRewardsInfo[0];

  return [communityStakingRewardsCounterPubkey, communityTokenStakingRewardsPubkey];
}

export default checkCommunityTokenStakingAccount;
