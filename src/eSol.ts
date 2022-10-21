/* tslint:disable:no-console */
import {
  PublicKey,
  Transaction,
  Keypair,
  Signer,
  TransactionInstruction,
  SystemProgram,
  StakeProgram,
} from '@solana/web3.js';

import { ESolConfig, ClusterType } from './config';
import { StakePoolProgram } from './service/stakepool-program';

import { lamportsToSol, solToLamports } from './utils';
import {
  getStakePoolAccount,
  addAssociatedTokenAccount,
  findWithdrawAuthorityProgramAddress,
  getTokenAccount,
  prepareWithdrawAccounts,
  newStakeAccount,
} from './service/service';
import checkDaoStakingAccounts from './service/checkDaoStakingAccounts';
import checkCommunityTokenStakingAccount from './service/checkCommunityTokenStakingAccount';
import { DAO_STATE_LAYOUT, COMMUNITY_TOKEN_LAYOUT, REFERRER_LIST_LAYOUT, ReferrerInfo } from './service/layouts';

import { TRANSACTION_FEE, RENT_EXEMPTION_FEE } from './service/constants';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import createWithdrawStakeAccountInstruction from './service/createWithdrawStakeAccountInstruction';
import getStakeAccountStatus from './service/getStakeAccountStatus';

export class ESol {
  public readonly config: ESolConfig;

  constructor(clusterType: ClusterType = 'testnet') {
    this.config = new ESolConfig(clusterType);
  }

  async createDepositSolTransactionWithReferrer(
    walletAddress: PublicKey,
    lamports: number,
    referrerAccount: PublicKey,
  ): Promise<Transaction> {
    const {
      connection,
      seedPrefixDaoState,
      seedPrefixCommunityToken,
      seedPrefixCommunityTokenStakingRewards,
      seedPrefixCommunityTokenStakingRewardsCounter,
    } = this.config;

    // Check user balance
    const userSolBalance = await connection.getBalance(walletAddress, 'confirmed');
    const lamportsToLeftInWallet = 3000000;
    let needForTransaction = lamportsToLeftInWallet;

    const transactionFee = solToLamports(TRANSACTION_FEE);
    const lamportsWithFee = lamports + transactionFee;

    if (userSolBalance < lamportsWithFee) {
      throw new Error(
        `Not enough SOL to deposit into pool. Maximum deposit amount is ${lamportsToSol(userSolBalance)} SOL.`,
      );
    }

    if (walletAddress.toString() === referrerAccount.toString()) {
      throw new Error(`Referrer address can't be the same as user address`);
    }

    if (lamports === 0) {
      throw new Error(`You can't deposit 0 SOL`);
    }

    const stakePoolAddress = this.config.eSOLStakePoolAddress;
    const stakePool = await getStakePoolAccount(connection, stakePoolAddress);

    const userSolTransfer = new Keypair();
    const signers: Signer[] = [userSolTransfer];
    const instructions: TransactionInstruction[] = [];

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: walletAddress,
        toPubkey: userSolTransfer.publicKey,
        lamports,
      }),
    );

    // Check dao stake accounts
    const daoCommunityTokenReceiverAccountRentSpace = await connection.getMinimumBalanceForRentExemption(165);

    needForTransaction += daoCommunityTokenReceiverAccountRentSpace;

    const poolTokenReceiverAccountRentSpace = await connection.getMinimumBalanceForRentExemption(165);
    needForTransaction += poolTokenReceiverAccountRentSpace;

    if (userSolBalance < lamports + needForTransaction) {
      lamports -= needForTransaction;
    }

    // Check dao stake accounts
    const [communityTokenInfo, communityTokenPubkey] = await checkDaoStakingAccounts(
      stakePoolAddress,
      connection,
      seedPrefixDaoState,
      seedPrefixCommunityToken,
    );

    // CommunityTokenStakingRewards
    // Account Data length = 105 bytes
    const [communityStakingRewardsCounterPubkey, communityTokenStakingRewardsPubkey] =
      await checkCommunityTokenStakingAccount(
        stakePoolAddress,
        connection,
        walletAddress,
        seedPrefixCommunityTokenStakingRewards,
        seedPrefixCommunityTokenStakingRewardsCounter,
      );

    const communityTokenStakingRewardsAccount = await connection.getAccountInfo(communityTokenStakingRewardsPubkey);

    if (!communityTokenStakingRewardsAccount) {
      // create CommunityTokenStakingRewards
      instructions.push(
        StakePoolProgram.createCommunityTokenStakingRewards({
          stakePoolPubkey: stakePoolAddress,
          ownerWallet: walletAddress,
          communityTokenStakingRewardsDTO: communityTokenStakingRewardsPubkey,
          communityTokenStakingRewardsCounterDTO: communityStakingRewardsCounterPubkey,
        }),
      );
    }

    // referrer part
    const referrerList = this.config.referrerListPrefix;

    const referrerListDtoInfo = await PublicKey.findProgramAddress(
      [Buffer.from(referrerList), stakePoolAddress.toBuffer(), StakePoolProgram.programId.toBuffer()],
      StakePoolProgram.programId,
    );

    const referrerListDtoPubkey = referrerListDtoInfo[0];
    const referrerListDtoAccount = await connection.getAccountInfo(referrerListDtoPubkey);

    if (!referrerListDtoAccount) {
      throw Error('Referer list account doesn`t exist');
    }

    const referrerListData = REFERRER_LIST_LAYOUT.decode(referrerListDtoAccount?.data);
    const referrersListArray = referrerListData.referrers;

    const isReferrerAccountInList = referrersListArray.some((referrer: ReferrerInfo) => {
      return referrer.pubKey.toString() === referrerAccount.toString();
    });

    if (!isReferrerAccountInList) {
      throw Error("Public key of referrer account doesn't exist in referrer list");
    }

    const { poolMint } = stakePool.account.data;

    // check associatedTokenAccount for RENT 165 BYTES FOR RENTs

    const poolTokenReceiverAccount = await addAssociatedTokenAccount(connection, walletAddress, poolMint, instructions);

    // check associatedTokenAccount for RENT 165 BYTES FOR RENTs
    const daoCommunityTokenReceiverAccount = await addAssociatedTokenAccount(
      connection,
      walletAddress,
      communityTokenInfo.tokenMint,
      instructions,
    );

    const withdrawAuthority = await findWithdrawAuthorityProgramAddress(StakePoolProgram.programId, stakePoolAddress);

    instructions.push(
      StakePoolProgram.depositSolDaoWithReferrerInstruction({
        daoCommunityTokenReceiverAccount,
        communityTokenStakingRewards: communityTokenStakingRewardsPubkey,
        ownerWallet: walletAddress,
        communityTokenPubkey,
        stakePoolPubkey: stakePoolAddress,
        depositAuthority: undefined,
        withdrawAuthority,
        reserveStakeAccount: stakePool.account.data.reserveStake,
        lamportsFrom: userSolTransfer.publicKey,
        poolTokensTo: poolTokenReceiverAccount,
        managerFeeAccount: stakePool.account.data.managerFeeAccount,
        referrerAccount,
        poolMint,
        lamports,
        referrerList: referrerListDtoPubkey,
      }),
    );

    const transaction = new Transaction();
    instructions.forEach((instruction: any) => transaction.add(instruction));
    transaction.feePayer = walletAddress;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.sign(...signers);

    return transaction;
  }

  async createUnDelegateSolTransaction(
    userAddress: PublicKey,
    eSolAmount: number,
    solWithdrawAuthority?: PublicKey,
  ): Promise<Transaction> {
    const { connection } = this.config;
    const tokenOwner = userAddress;
    const solReceiver = userAddress;

    const stakePoolAddress = this.config.eSOLStakePoolAddress;
    const stakePool = await getStakePoolAccount(connection, stakePoolAddress);

    const lamportsToWithdraw = solToLamports(eSolAmount);

    const userSolBalance = await connection.getBalance(userAddress, 'confirmed');
    const transactionFee = solToLamports(TRANSACTION_FEE);
    const rentExemptionFee = solToLamports(RENT_EXEMPTION_FEE);

    if (userSolBalance < transactionFee + rentExemptionFee) {
      throw Error("You don't have enough SOL to complete this transaction");
    }

    const reserveStake = await connection.getAccountInfo(stakePool.account.data.reserveStake);
    const stakeReceiverAccountBalance = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
    const rateOfExchange = stakePool.account.data.rateOfExchange;
    const rate = rateOfExchange ? rateOfExchange.numerator.toNumber() / rateOfExchange.denominator.toNumber() : 1;
    const solToWithdraw = lamportsToWithdraw * rate;

    if (reserveStake?.lamports || reserveStake?.lamports === 0) {
      const availableAmount = reserveStake?.lamports - stakeReceiverAccountBalance;
      if (availableAmount < solToWithdraw) {
        const transactionWithUnstakeIt = await this.createWithdrawSolTransaction(userAddress, eSolAmount, true);

        return transactionWithUnstakeIt;
      }
    }

    // dao part
    const daoStateDtoInfo = await PublicKey.findProgramAddress(
      [Buffer.from(this.config.seedPrefixDaoState), stakePoolAddress.toBuffer(), StakePoolProgram.programId.toBuffer()],
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

    const poolTokenAccount = await getAssociatedTokenAddress(
      stakePool.account.data.poolMint,
      tokenOwner,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const tokenAccount = await getTokenAccount(connection, poolTokenAccount, stakePool.account.data.poolMint);
    if (!tokenAccount) {
      throw new Error('Invalid token account');
    }

    // Check withdrawFrom balance
    if (tokenAccount.amount.toNumber() < lamportsToWithdraw) {
      throw new Error(
        `Not enough token balance to withdraw ${lamportsToSol(lamportsToWithdraw)} pool tokens.
          Maximum withdraw amount is ${lamportsToSol(tokenAccount.amount.toNumber())} pool tokens.`,
      );
    }

    // Construct transaction to withdraw from withdrawAccounts account list
    const instructions: TransactionInstruction[] = [];
    const userTransferAuthority = Keypair.generate();

    const signers: Signer[] = [userTransferAuthority];

    // dao
    const communityTokenStakingRewardsInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityTokenStakingRewards),
        stakePoolAddress.toBuffer(),
        tokenOwner.toBuffer(),
        StakePoolProgram.programId.toBuffer(),
      ],
      StakePoolProgram.programId,
    );
    const communityTokenStakingRewardsPubkey: any = communityTokenStakingRewardsInfo[0];
    const communityTokenStakingRewardsAccount = await connection.getAccountInfo(communityTokenStakingRewardsPubkey);

    // We can be sure that this account already exists, as it is created when you deposit.
    // But there are some number of users who made a deposit before updating the code with DAO strategy,
    // so here we create an account especially for them.
    // {
    const communityTokenDtoInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityToken),
        stakePoolAddress.toBuffer(),
        StakePoolProgram.programId.toBuffer(),
      ],
      StakePoolProgram.programId,
    );
    const communityTokenPubkey = communityTokenDtoInfo[0];
    const communityTokenAccount = await connection.getAccountInfo(communityTokenPubkey);

    if (!communityTokenAccount) {
      throw Error('Community token is not exist'); // if isDaoEnabled -> error should NOT happened
    }

    const communityTokenInfo = COMMUNITY_TOKEN_LAYOUT.decode(communityTokenAccount!.data);

    // check associatedTokenAccount for RENT 165 BYTES FOR RENTs
    const daoCommunityTokenReceiverAccount = await addAssociatedTokenAccount(
      connection,
      tokenOwner,
      communityTokenInfo.tokenMint,
      instructions,
    );

    // communityTokenStakingRewardsCounter
    const communityTokenStakingRewardsCounterDtoInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityTokenStakingRewardsCounter),
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

    if (!communityTokenStakingRewardsAccount) {
      // create CommunityTokenStakingRewards
      instructions.push(
        StakePoolProgram.createCommunityTokenStakingRewards({
          stakePoolPubkey: stakePoolAddress,
          ownerWallet: tokenOwner,
          communityTokenStakingRewardsDTO: communityTokenStakingRewardsPubkey,
          communityTokenStakingRewardsCounterDTO: communityStakingRewardsCounterPubkey,
        }),
      );
    }

    instructions.push(
      createApproveInstruction(
        poolTokenAccount,
        userTransferAuthority.publicKey,
        tokenOwner,
        lamportsToWithdraw,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );

    const poolWithdrawAuthority = await findWithdrawAuthorityProgramAddress(
      StakePoolProgram.programId,
      stakePoolAddress,
    );

    if (solWithdrawAuthority) {
      const expectedSolWithdrawAuthority = stakePool.account.data.solWithdrawAuthority;
      if (!expectedSolWithdrawAuthority) {
        throw new Error('SOL withdraw authority specified in arguments but stake pool has none');
      }
      if (solWithdrawAuthority.toBase58() !== expectedSolWithdrawAuthority.toBase58()) {
        throw new Error(
          `Invalid deposit withdraw specified, expected ${expectedSolWithdrawAuthority.toBase58()}, received ${solWithdrawAuthority.toBase58()}`,
        );
      }
    }

    const withdrawTransaction = StakePoolProgram.withdrawSolWithDaoInstruction({
      daoCommunityTokenReceiverAccount,
      communityTokenStakingRewards: communityTokenStakingRewardsPubkey,
      ownerWallet: tokenOwner,
      communityTokenPubkey,
      stakePoolPubkey: stakePoolAddress,
      solWithdrawAuthority,
      stakePoolWithdrawAuthority: poolWithdrawAuthority,
      userTransferAuthority: userTransferAuthority.publicKey,
      poolTokensFrom: poolTokenAccount,
      reserveStakeAccount: stakePool.account.data.reserveStake,
      managerFeeAccount: stakePool.account.data.managerFeeAccount,
      poolMint: stakePool.account.data.poolMint,
      lamportsTo: solReceiver,
      poolTokens: lamportsToWithdraw,
    });

    instructions.push(withdrawTransaction);

    const transaction = new Transaction();
    instructions.forEach((instruction: any) => transaction.add(instruction));
    transaction.feePayer = solReceiver;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.sign(...signers);

    return transaction;
  }

  async createWithdrawSolTransaction(
    userAddress: PublicKey,
    eSolAmount: number,
    withUnstakeIt = false,
    stakeReceiver?: PublicKey,
    poolTokenAccount?: PublicKey,
  ): Promise<Transaction> {
    const { connection, unstakeItPoolAddress, unstakeProgramId } = this.config;
    const stakePoolAddress = this.config.eSOLStakePoolAddress;
    const stakePool = await getStakePoolAccount(connection, stakePoolAddress);

    const lamportsToWithdraw = solToLamports(eSolAmount);

    const userSolBalance = await connection.getBalance(userAddress, 'confirmed');
    const transactionFee = solToLamports(TRANSACTION_FEE);
    const rentExemptionFee = solToLamports(RENT_EXEMPTION_FEE);

    if (userSolBalance < transactionFee + rentExemptionFee) {
      throw Error("You don't have enough SOL to complete this transaction");
    }

    // dao part
    const daoStateDtoInfo = await PublicKey.findProgramAddress(
      [Buffer.from(this.config.seedPrefixDaoState), stakePoolAddress.toBuffer(), StakePoolProgram.programId.toBuffer()],
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

    if (!poolTokenAccount) {
      poolTokenAccount = await getAssociatedTokenAddress(
        stakePool.account.data.poolMint,
        userAddress,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
    }

    const tokenAccount = await getTokenAccount(connection, poolTokenAccount, stakePool.account.data.poolMint);
    if (!tokenAccount) {
      throw new Error('Invalid token account');
    }

    // Check withdrawFrom balance
    if (tokenAccount.amount.toNumber() < lamportsToWithdraw) {
      throw new Error(
        `Not enough token balance to withdraw ${lamportsToSol(lamportsToWithdraw)} pool tokens.
        Maximum withdraw amount is ${lamportsToSol(tokenAccount.amount.toNumber())} pool tokens.`,
      );
    }

    const withdrawAuthority = await findWithdrawAuthorityProgramAddress(StakePoolProgram.programId, stakePoolAddress);

    // Construct transaction to withdraw from withdrawAccounts account list
    const instructions: TransactionInstruction[] = [];
    const userTransferAuthority = Keypair.generate();

    const signers: Signer[] = [userTransferAuthority];

    // dao
    const communityTokenStakingRewardsInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityTokenStakingRewards),
        stakePoolAddress.toBuffer(),
        userAddress.toBuffer(),
        StakePoolProgram.programId.toBuffer(),
      ],
      StakePoolProgram.programId,
    );
    const communityTokenStakingRewardsPubkey: any = communityTokenStakingRewardsInfo[0];
    const communityTokenStakingRewardsAccount = await connection.getAccountInfo(communityTokenStakingRewardsPubkey);

    // WE SHOULD CHECK NEXT PART IF USER WITHDRAW !!NOT!! ALL ESOL

    // We can be sure that this account already exists, as it is created when you deposit.
    // But there are some number of users who made a deposit before updating the code with DAO strategy,
    // so here we create an account especially for them.
    // {
    const communityTokenDtoInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityToken),
        stakePoolAddress.toBuffer(),
        StakePoolProgram.programId.toBuffer(),
      ],
      StakePoolProgram.programId,
    );
    const communityTokenPubkey = communityTokenDtoInfo[0];
    const communityTokenAccount = await connection.getAccountInfo(communityTokenPubkey);

    if (!communityTokenAccount) {
      throw Error('Community token is not exist'); // if isDaoEnabled -> error should NOT happened
    }

    const communityTokenInfo = COMMUNITY_TOKEN_LAYOUT.decode(communityTokenAccount!.data);
    // check associatedTokenAccount for RENT 165 BYTES FOR RENTs
    const daoCommunityTokenReceiverAccount = await addAssociatedTokenAccount(
      connection,
      userAddress,
      communityTokenInfo.tokenMint,
      instructions,
    );
    // }

    // communityTokenStakingRewardsCounter
    const communityTokenStakingRewardsCounterDtoInfo = await PublicKey.findProgramAddress(
      [
        Buffer.from(this.config.seedPrefixCommunityTokenStakingRewardsCounter),
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

    if (!communityTokenStakingRewardsAccount) {
      // create CommunityTokenStakingRewards
      instructions.push(
        StakePoolProgram.createCommunityTokenStakingRewards({
          stakePoolPubkey: stakePoolAddress,
          ownerWallet: userAddress,
          communityTokenStakingRewardsDTO: communityTokenStakingRewardsPubkey,
          communityTokenStakingRewardsCounterDTO: communityStakingRewardsCounterPubkey,
        }),
      );
    }

    instructions.push(
      createApproveInstruction(
        poolTokenAccount,
        userTransferAuthority.publicKey,
        userAddress,
        lamportsToWithdraw,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );

    const maxWithdrawAccounts = withUnstakeIt ? 1 : 2;

    const withdrawAccounts: any = await prepareWithdrawAccounts(
      connection,
      stakePool.account.data,
      stakePoolAddress,
      lamportsToWithdraw,
      maxWithdrawAccounts,
    );

    if (withdrawAccounts.length === 0) {
      throw Error('Not available at the moment. Please try again later. Sorry for the inconvenience.');
    }

    let availableSol = 0;

    withdrawAccounts.forEach((account: any) => {
      availableSol += account.poolAmount;
    });

    if (availableSol < lamportsToWithdraw) {
      throw Error(
        `Currently, you can undelegate only ${lamportsToSol(
          availableSol,
        )} SOL within one transaction due to delayed unstake limitations. Please unstake the desired amount in few transactions.
      Note that you will be able to track your unstaked SOL in the “Wallet” tab as a summary of transactions!.`,
      );
    }
    let numberOfStakeAccounts = 1;

    function incrementStakeAccount() {
      numberOfStakeAccounts += 1;
    }

    // Go through prepared accounts and withdraw/claim them
    // eslint-disable-next-line no-restricted-syntax
    for await (const withdrawAccount of withdrawAccounts) {
      if (poolTokenAccount) {
        incrementStakeAccount();

        const stakeReceiverAccountBalance = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

        const stakeToReceive = await newStakeAccount(
          connection,
          userAddress,
          instructions,
          stakeReceiverAccountBalance,
          numberOfStakeAccounts,
          incrementStakeAccount,
        );
        stakeReceiver = stakeToReceive;

        instructions.push(
          StakePoolProgram.withdrawStakeWithDao({
            daoCommunityTokenReceiverAccount,
            communityTokenStakingRewards: communityTokenStakingRewardsPubkey,
            ownerWallet: userAddress,
            communityTokenPubkey,
            stakePool: stakePoolAddress,
            validatorList: stakePool.account.data.validatorList,
            validatorStake: withdrawAccount.stakeAddress,
            destinationStake: stakeToReceive,
            destinationStakeAuthority: userAddress,
            sourceTransferAuthority: userTransferAuthority.publicKey,
            sourcePoolAccount: poolTokenAccount,
            managerFeeAccount: stakePool.account.data.managerFeeAccount,
            poolMint: stakePool.account.data.poolMint,
            poolTokens: withdrawAccount.poolAmount,
            withdrawAuthority,
          }),
        );

        const deactivateTransaction = StakeProgram.deactivate({
          stakePubkey: stakeToReceive,
          authorizedPubkey: userAddress,
        });

        for (const deactivateInstruction of deactivateTransaction.instructions) {
          const instruction = new TransactionInstruction(deactivateInstruction);
          instructions.push(instruction);
        }

        if (withUnstakeIt) {
          const unstakeItInstructions = await createWithdrawStakeAccountInstruction(
            connection,
            unstakeItPoolAddress,
            unstakeProgramId,
            stakeToReceive,
            'Deactivating',
            userAddress,
          );
          instructions.push(...unstakeItInstructions);
        }
      }
    }

    const transaction = new Transaction();
    instructions.forEach((instruction: any) => transaction.add(instruction));
    transaction.feePayer = userAddress;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.sign(...signers);

    return transaction;
  }

  async createWithdrawStakeAccountTransaction(
    stakeAccountPubKey: PublicKey,
    userWalletAddress: PublicKey,
  ): Promise<Transaction> {
    const { connection, unstakeItPoolAddress, unstakeProgramId } = this.config;
    let accountStatus = 'Initialized';

    try {
      const stakeAccount = await connection.getAccountInfo(stakeAccountPubKey);

      const { stake } = stakeAccount.account.data.parsed.info;
      const { epoch } = connection.getEpochInfo();

      if (stake) {
        accountStatus = getStakeAccountStatus(
          +stake.delegation.activationEpoch,
          +epoch,
          +stake.delegation.deactivationEpoch,
        );
      }
    } catch (err) {
      console.error(err);
    }

    const unstakeItInstructions = await createWithdrawStakeAccountInstruction(
      connection,
      unstakeItPoolAddress,
      unstakeProgramId,
      stakeAccountPubKey,
      accountStatus,
      userWalletAddress,
    );

    const transaction = new Transaction();
    unstakeItInstructions.forEach((instruction: any) => transaction.add(instruction));
    transaction.feePayer = userWalletAddress;
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    return transaction;
  }
}
