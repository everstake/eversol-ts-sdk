import { PublicKey } from '@solana/web3.js';

import { ESol } from '../src/eSol';
import { getStakePoolAccount } from '../src/service/service';
import { lamportsToSol, solToLamports } from '../src/utils';
import {
  sendLamportsToTestingWallet,
  CONNECTION,
  USER_SDK,
  PROVIDER,
  REFERRING_ACCOUNTS_LIST,
  TESTNET_STAKEPOOL_ACCOUNT,
  getESolBalance,
  testingNetwork,
  referrerAccount,
} from './test-environments';

// settings
const everSol = new ESol(testingNetwork);
const depositAmount = solToLamports(1);
const undelegateAmount = 0.01;

// initial state
const user = USER_SDK;
let stakePool;
let userSolBalance;
let userESoLamportsBalance;

describe('ESol testing SDK', () => {
  beforeAll(async () => {
    // airdrop SOL if needed
    await sendLamportsToTestingWallet(user.publicKey);

    userSolBalance = lamportsToSol(await CONNECTION.getBalance(user.publicKey, 'confirmed'));
    stakePool = await getStakePoolAccount(CONNECTION, new PublicKey(TESTNET_STAKEPOOL_ACCOUNT));

    // get eSol balance
    userESoLamportsBalance = getESolBalance(stakePool, user.publicKey);
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

    it('check SOL balance after transaction', async () => {
      try {
        const depositTransaction = await everSol.depositSolTransaction(user.publicKey, depositAmount, referrerAccount);
        const transactionHash = await PROVIDER.send(depositTransaction);
        console.log('transaction hash:', transactionHash, depositTransaction.instructions.length);
        const transInfo = await CONNECTION.getTransaction(transactionHash, { commitment: 'confirmed' });

        const solBalance: any = transInfo?.meta?.postBalances[0];
        const newSolBalance = lamportsToSol(solBalance);
        const differenceAfterTransaction = userSolBalance - newSolBalance;

        expect(differenceAfterTransaction).toBeGreaterThan(lamportsToSol(depositAmount));
      } catch (err) {
        console.log(err);
      }
    });
  });

  describe('Undelegate SOL', () => {
    it('is enough SOL in reserve account', async () => {
      const reserveStake = await CONNECTION.getAccountInfo(stakePool.account.data.reserveStake);
      const rateOfExchange = stakePool.account.data.rateOfExchange;
      const rate = rateOfExchange ? rateOfExchange.numerator.toNumber() / rateOfExchange.denominator.toNumber() : 1;
      const solToWithdraw = undelegateAmount * rate;

      if (reserveStake?.lamports || reserveStake?.lamports === 0) {
        expect(lamportsToSol(reserveStake?.lamports)).toBeGreaterThan(solToWithdraw);
      }
    });

    it('is enough eSOL in user wallet', async () => {
      const lamportsToWithdraw = solToLamports(undelegateAmount);

      if (userESoLamportsBalance < lamportsToWithdraw) {
        expect(lamportsToSol(userESoLamportsBalance)).toBeGreaterThan(lamportsToWithdraw);
      }
    });

    it('check transaction result', async () => {
      try {
        const unDelegateTransaction = await everSol.unDelegateSolTransaction(user.publicKey, undelegateAmount);
        const transactionHash = await PROVIDER.send(unDelegateTransaction);
        console.log('transaction hash:', transactionHash, unDelegateTransaction.instructions.length);
        const transInfo = await CONNECTION.getTransaction(transactionHash, { commitment: 'confirmed' });

        const solBalance: any = transInfo?.meta?.postBalances[0];
        const newSolBalance = lamportsToSol(solBalance);

        expect(solBalance).toBeGreaterThan(lamportsToSol(newSolBalance));
      } catch (err) {
        console.log(err);
      }
    });
  });

  afterAll(() => {
    userSolBalance = null;
    userESoLamportsBalance = null;
  });
});
