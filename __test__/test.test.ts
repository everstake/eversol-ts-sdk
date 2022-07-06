import { PublicKey } from '@solana/web3.js';

import { ESol } from '../src/eSol';
import { lamportsToSol, solToLamports } from '../src/utils';
import {
  TESTING_LAMPORTS_AMOUNT,
  sendLamportsToTestingWallet,
  CONNECTION,
  USER_SDK,
  PROVIDER,
} from './test-environments';

const testingNetwork = 'testnet';
const everSol = new ESol(testingNetwork);
const user = USER_SDK;

describe('ESol testing SDK', () => {
  beforeAll(async () => {
    // airdrop SOL if needed
    await sendLamportsToTestingWallet(user.publicKey, TESTING_LAMPORTS_AMOUNT);
  });

  describe('Delegate SOL', () => {
    it('check SOL balance', async () => {
      // prepare info
      const referrerAccount = new PublicKey('Dy4HN6gtzZBEpNYZvRZvsKRn9KSDdyYWu2LgqUr24Fjm');
      const depositAmount = solToLamports(0.5);

      try {
        let userBalance = lamportsToSol(await CONNECTION.getBalance(user.publicKey, 'confirmed'));

        const depositTransaction = await everSol.depositSolTransaction(user.publicKey, depositAmount, referrerAccount);
        const transactionHash = await PROVIDER.send(depositTransaction);
        console.log('transaction hash:', transactionHash, depositTransaction.instructions.length);
        const transInfo = await CONNECTION.getTransaction(transactionHash, { commitment: 'confirmed' });

        const solBalance: any = transInfo?.meta?.postBalances[0];

        const newSolBalance = lamportsToSol(solBalance);
        const differenceAfterTransaction = userBalance - newSolBalance;

        expect(differenceAfterTransaction).toBeGreaterThan(lamportsToSol(depositAmount));
      } catch (err) {
        console.log(err);
      }
    });
  });
});
