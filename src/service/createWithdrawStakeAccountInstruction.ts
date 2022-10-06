/* tslint:disable:no-console */
import { PublicKey } from '@solana/web3.js';
import {
  IDL_JSON as UNSTAKE_IDL_JSON,
  Unstake,
  Wallet,
  AnchorProvider,
  Program,
  findProtocolFeeAccount,
  unstakeTx,
  deactivateStakeAccountTx,
} from '@unstake-it/sol';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

import { USTAKE_IT_REFERRER_ADDRESS } from './constants';

const createWithdrawStakeAccountInstruction = async (
  connection: any,
  stakeAccPubkey: PublicKey,
  unstakeItPoolAddress: PublicKey,
  unstakeItProgramId: PublicKey,
  accountStatus: string,
  walletAddress: PublicKey,
) => {
  const phantomAdapter = new PhantomWalletAdapter();

  const provider = new AnchorProvider(connection, phantomAdapter as unknown as Wallet, { commitment: 'processed' });

  const unstakeProgram: Program<Unstake> = new Program(
    UNSTAKE_IDL_JSON as unknown as Unstake,
    unstakeItProgramId,
    provider,
  );

  let protocolFee;
  try {
    const protocolFeeAddress = await findProtocolFeeAccount(unstakeProgram.programId);
    const fetchedProtocolFeeData = await unstakeProgram.account.protocolFee.fetch(protocolFeeAddress[0]);

    protocolFee = {
      publicKey: protocolFeeAddress[0],
      account: fetchedProtocolFeeData,
    };
  } catch (err) {
    console.error(err);
  }

  const tx = await unstakeTx(unstakeProgram, {
    stakeAccount: stakeAccPubkey,
    poolAccount: unstakeItPoolAddress,
    unstaker: walletAddress,
    protocolFee,
    referrer: USTAKE_IT_REFERRER_ADDRESS,
  });

  if (accountStatus === 'Active' || accountStatus === 'Activating') {
    tx.add(
      await deactivateStakeAccountTx(unstakeProgram, {
        stakeAccount: stakeAccPubkey,
        poolAccount: unstakeItPoolAddress,
      }),
    );
  }

  return tx.instructions;
};

export default createWithdrawStakeAccountInstruction;
