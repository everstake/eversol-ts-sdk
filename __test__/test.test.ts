import { PublicKey } from '@solana/web3.js';

import { ESol } from '../src/eSol';
import { lamportsToSol, solToLamports } from '../src/utils';
import {
  sendLamportsToTestingWallet,
  CONNECTION,
  USER_SDK,
  PROVIDER,
  REFERRING_ACCOUNTS_LIST,
} from './test-environments';

// settings
const testingNetwork = 'testnet';
const everSol = new ESol(testingNetwork);
const user = USER_SDK;
const referrerAccount = new PublicKey('Dy4HN6gtzZBEpNYZvRZvsKRn9KSDdyYWu2LgqUr24Fjm');
const depositAmount = solToLamports(0.1);

describe('ESol testing SDK', () => {
  beforeAll(async () => {
    // airdrop SOL if needed
    await sendLamportsToTestingWallet(user.publicKey);
  });

  describe('Delegate SOL', () => {
    it('check for correct lamports value', async () => {
      if (depositAmount === 0) {
        await expect(everSol.depositSolTransaction(user.publicKey, depositAmount, referrerAccount)).rejects.toThrow(
          "You can't deposit 0 SOL",
        );
      }
    });

    it('check referring account', () => {
      expect(REFERRING_ACCOUNTS_LIST).toContain(referrerAccount.toString());
    });

    it('user address can`t be the same as referrer account', () => {
      expect(referrerAccount.toString()).not.toBe(USER_SDK.publicKey.toString());
    });

    it('check SOL balance', async () => {
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
