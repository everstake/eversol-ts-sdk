<div align="center">
<a href="https://eversol.one/">

![Esol logo](src/logo/esol.svg?raw=true 'Eversol')

</a>
</div>

# Eversol Stake Pool SDK

Eversol is a liquid staking protocol built on Solana. Eversol's main concept is to dedicate a percentage of the pool rewards (currently, 7% in the proposed scheme of Fees and Rewards Distribution) to the Stake Pool's Treasury, to fund the best projects being built on Solana. Unlike other stake pools, we will directly facilitate and boost the DeFi ecosystem by helping new apps and products come to life!

## Installation

```bash
$ npm install @everstake/eversol-ts-sdk
```

### Initialize the library

Import the main client class ESol and initialize it with the desired cluster type:

```ts
import { ESol } from '@everstake/eversol-ts-sdk';

// initializes for mainnet-beta
const eSol = new ESol('mainnet-beta');

// initializes for testnet
const eSol = new ESol('testnet');

// initializes for devnet
const eSol = new ESol('devnet');
```

### Deposit SOL Transaction

Stake SOL and get your eSOL:

```ts
...
const depositSolTransaction = await eSol.createDepositSolTransactionWithReferrer(userAddress, amountLamports, referrerAccount)
// referrerAccount - should exist in referrer list (contact our team to add your address)
// than sign and send the `transaction`
```

### Instant unstake eSOL Transaction

Skip the basic Solana cool-down period and undelegate stake instantly. If the feature is not available (meaning there is not enough liquidity/reserve in the pool to cover instant unstaking), please use the standard Unstake:

```ts
...
const instantUnstakeTransaction = await eSol.createUnDelegateSolTransaction(userAddress, eSolAmount)
// than sign and send the `transaction`
```

### Classic delayed unstake eSOL Transaction

Your stake will be deactivated with the beginning of a new epoch. Once the stake is inactive, feel free to withdraw the tokens within your wallet, in compliance with regular Solana staking terms.

```ts
...
const delayedUnstakeTransaction = await eSol.createWithdrawSolTransaction(userAddress, eSolAmount, false)
// than sign and send the `transaction`
```

### Withdraw Stake account
```ts
...
const withdrawStakeAccountTransaction = await eSol.createWithdrawStakeAccountTransaction(stakeAccountPubKey, userWalletAddress)
// than sign and send the `transaction`
```

## Learn more

- [Eversol web](https://eversol.one/)
- [Eversol docs](https://docs.eversol.one/overview/welcome-to-eversol)
