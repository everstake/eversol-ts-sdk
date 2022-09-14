import { PublicKey } from '@solana/web3.js';

import { StakePoolProgram } from './stakepool-program';
import { COMMUNITY_TOKEN_LAYOUT, DAO_STATE_LAYOUT } from './layouts';

async function checkDaoStakingAccounts(
  stakePoolAddress: PublicKey,
  connection: any,
  seedPrefixDaoState: string,
  seedPrefixCommunityToken: string,
) {
  const daoStateDtoInfo = await PublicKey.findProgramAddress(
    [Buffer.from(seedPrefixDaoState), stakePoolAddress.toBuffer(), StakePoolProgram.programId.toBuffer()],
    StakePoolProgram.programId,
  );
  const daoStateDtoPubkey = daoStateDtoInfo[0];

  const daoStateDtoInfoAccount = await connection.getAccountInfo(daoStateDtoPubkey);

  if (!daoStateDtoInfoAccount) {
    throw Error("Didn't find dao state account");
  }

  const daoState = DAO_STATE_LAYOUT.decode(daoStateDtoInfoAccount!.data);
  const isDaoEnabled = daoState.isEnabled;

  if (!isDaoEnabled) {
    throw Error('Dao is not enable'); // it should never happened!!!
  }

  // WE SHOULD CHECK NEXT PART IF USER WITHDRAW !!NOT!! ALL ESOL

  // We can be sure that this account already exists, as it is created when you deposit.
  // But there are some number of users who made a deposit before updating the code with DAO strategy,
  // so here we create an account especially for them.
  // {

  const communityTokenDtoInfo = await PublicKey.findProgramAddress(
    [Buffer.from(seedPrefixCommunityToken), stakePoolAddress.toBuffer(), StakePoolProgram.programId.toBuffer()],
    StakePoolProgram.programId,
  );
  const communityTokenPubkey = communityTokenDtoInfo[0];
  const communityTokenAccount = await connection.getAccountInfo(communityTokenPubkey);

  if (!communityTokenAccount) {
    throw Error('Community token is not exist'); // if isDaoEnabled -> error should NOT happened
  }

  const communityTokenInfo = COMMUNITY_TOKEN_LAYOUT.decode(communityTokenAccount!.data);

  return [communityTokenInfo, communityTokenPubkey];
}

export default checkDaoStakingAccounts;
