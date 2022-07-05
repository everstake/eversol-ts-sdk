import { Keypair } from '@solana/web3.js';

import { ESol } from '../src/eSol';
import { TESTING_LAMPORTS_AMOUNT, sendLamportsToTestingWallet, CONNECTION } from './test-environments';

const everSol = new ESol();

describe('ESol testing SDK', () => {
  beforeAll(async () => {
    const SDK_USER = Keypair.generate();
    const userSolBalance1 = await CONNECTION.getBalance(SDK_USER.publicKey, 'confirmed');
    console.log(userSolBalance1, 'userSolBalance1');
    
    await sendLamportsToTestingWallet(SDK_USER.publicKey, TESTING_LAMPORTS_AMOUNT);
    const userSolBalance2 = await CONNECTION.getBalance(SDK_USER.publicKey, 'confirmed');
    console.log(userSolBalance2, 'userSolBalance2');
  });

  it('should return 5 for add(2,3)', () => {
    expect(everSol.add(2, 3)).toBe(5);
  });
});
