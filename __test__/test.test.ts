import { PublicKey } from '@solana/web3.js';
import { sendAndConfirmRawTransaction } from '@solana/web3.js';

import { ESol } from '../src/eSol';
import { lamportsToSol, solToLamports } from '../src/utils';
import { TESTING_LAMPORTS_AMOUNT, sendLamportsToTestingWallet, CONNECTION, USER_SDK } from './test-environments';

const testingNetwork = 'testnet';
const everSol = new ESol(testingNetwork);
const user = USER_SDK;

describe('ESol testing SDK', () => {
  beforeAll(async () => {
    await sendLamportsToTestingWallet(user.publicKey, TESTING_LAMPORTS_AMOUNT);
  });

  describe('Delegate SOL', () => {
    it('check esol balance', async () => {
      console.log("start deposit")
      const referrerAccount = new PublicKey('Dy4HN6gtzZBEpNYZvRZvsKRn9KSDdyYWu2LgqUr24Fjm');
      const depositAmount = solToLamports(0.5)

      try {
        const depositTransaction = await everSol.depositSolTransaction(user.publicKey, depositAmount, referrerAccount);
        const rawTransaction = depositTransaction.serialize();
        const transactionHash = await sendAndConfirmRawTransaction(CONNECTION, rawTransaction);
        console.log(transactionHash, "transactionHash")
        console.log('Deposit tx:', transactionHash, depositTransaction.instructions.length);
        const transInfo = await CONNECTION.getTransaction(transactionHash, { commitment: 'finalized' });
        const solBalance: any = transInfo?.meta?.postBalances[0];

        const newSolBalance = lamportsToSol(solBalance);
        const newESolInfo = transInfo?.meta?.postTokenBalances?.find(
          (account: any) => account.owner === user.publicKey.toString(),
        );
        const esolInfo = {
          balance: newESolInfo?.uiTokenAmount.uiAmount,
          chainId: 102,
          name: 'eSol token',
          symbol: 'eSol',
        };
        console.log('newSolBalance', newSolBalance);
        console.log('esolInfo', esolInfo);
      } catch (err) {
        console.log(err);
      }
    });
  });
});
