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
```

### Deposit SOL Transaction

Stake SOL and get your eSOL:

```ts
...
const depositSolTransaction = await eSol.depositSolTransaction(userAddress, amountLamports, referrerAccount)
// referrerAccount - should exist in referrer list (contact our team to add your address)
// than sign and send the `transaction`
```

### Instant unstake eSOL Transaction

Skip the basic Solana cool-down period and undelegate stake instantly. If the feature is not available (meaning there is not enough liquidity/reserve in the pool to cover instant unstaking), please use the standard Unstake:

```ts
...
const instantUnstakeTransaction = await eSol.unDelegateSolTransaction(userAddress, amountLamports)
// than sign and send the `transaction`
```

### Classic delayed unstake eSOL Transaction

Your stake will be deactivated with the beginning of a new epoch. Once the stake is inactive, feel free to withdraw the tokens within your wallet, in compliance with regular Solana staking terms.

```ts
...
const delayedUnstakeTransaction = await eSol.withdrawSolTransaction(userAddress, amountLamports)
// than sign and send the `transaction`
```

## Learn more

- [Eversol web](https://eversol.one/)
- [Eversol docs](https://docs.eversol.one/overview/welcome-to-eversol)

export const STAKE_POOL_LAYOUT = struct<StakePool>([
  // rustEnum(AccountTypeKind, 'accountType'),
  u8("accountType"),
  publicKey("manager"),
  publicKey("staker"),
  publicKey("stakeDepositAuthority"),
  u8("stakeWithdrawBumpSeed"),
  publicKey("validatorList"),
  publicKey("reserveStake"),
  publicKey("poolMint"),
  publicKey("managerFeeAccount"),
  publicKey("tokenProgramId"),
  u64("totalLamports"),
  u64("poolTokenSupply"),
  u64("lastUpdateEpoch"),
  struct([u64("unixTimestamp"), u64("epoch"), publicKey("custodian")], "lockup"),
  struct(feeFields, "epochFee"),
  option(struct(feeFields), "nextEpochFee"),
  option(publicKey(), "preferredDepositValidatorVoteAddress"),
  option(publicKey(), "preferredWithdrawValidatorVoteAddress"),
  struct(feeFields, "stakeDepositFee"),
  struct(feeFields, "stakeWithdrawalFee"),
  option(struct(feeFields), "nextWithdrawalFee"),
  u8("stakeReferralFee"),
  option(publicKey(), "solDepositAuthority"),
  struct(feeFields, "solDepositFee"),
  u8("solReferralFee"),
  option(publicKey(), "solWithdrawAuthority"),
  struct(feeFields, "solWithdrawalFee"),
  option(struct(feeFields), "nextSolWithdrawalFee"),
  u64("lastEpochPoolTokenSupply"),
  u64("lastEpochTotalLamports"),
  option(struct(rateOfExchangeFields), "rateOfExchange"),
  publicKey("treasuryFeeAccount"),
  struct(feeFields, "treasuryFee"),
  u64("totalLamportsLiquidity"),
]);

  maxValidatorYieldPerEpochNumerator: BN;
