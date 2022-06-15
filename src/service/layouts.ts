import { publicKey, struct, u32, u64, u16, u8, option, vec, bool } from '@project-serum/borsh';
import { PublicKey } from '@solana/web3.js';
import * as BN from 'bn.js';

export interface Fee {
  denominator: BN;
  numerator: BN;
}

export interface RateOfExchange {
  denominator: BN;
  numerator: BN;
}

export interface DaoState {
  isEnabled: boolean;
}
export interface CommunityToken {
  tokenMint: PublicKey;
}

const feeFields = [u64('denominator'), u64('numerator')];

const rateOfExchangeFields = [u64('denominator'), u64('numerator')];

export interface Lockup {
  unixTimestamp: number;
  epoch: number;
  custodian: PublicKey;
}

export interface MetricsDepositReferrerCounter {
  accountGroup: BN;
  counterForGroup: number;
  flushedGroup: BN;
  flushedCounter: number;
}

export const METRICS_DEPOSIT_REFERRER_LAYOUT = struct<MetricsDepositReferrerCounter>([
  u64('accountGroup'),
  u16('counterForGroup'),
  u64('flushedGroup'),
  u16('flushedCounter'),
]);

export interface TokenAccount {
  mint: PublicKey;
  owner: PublicKey;
  amount: BN;
  delegate?: PublicKey | undefined;
  state: number;
  delegatedAmount?: BN | undefined;
  closeAuthority?: PublicKey | undefined;
}

export const ACCOUNT_LAYOUT = struct<TokenAccount>([
  publicKey('mint'),
  publicKey('owner'),
  u64('amount'),
  u32('delegateOption'),
  publicKey('delegate'),
  u8('state'),
  u32('isNativeOption'),
  u64('isNative'),
  u64('delegatedAmount'),
  u32('closeAuthorityOption'),
  publicKey('closeAuthority'),
]);

export enum AccountType {
  Uninitialized,
  StakePool,
  ValidatorList,
}

export interface StakePool {
  accountType: AccountType;
  manager: PublicKey;
  staker: PublicKey;
  stakeDepositAuthority: PublicKey;
  stakeWithdrawBumpSeed: number;
  validatorList: PublicKey;
  reserveStake: PublicKey;
  poolMint: PublicKey;
  managerFeeAccount: PublicKey;
  tokenProgramId: PublicKey;
  totalLamports: BN;
  poolTokenSupply: BN;
  lastUpdateEpoch: BN;
  lockup: Lockup;
  epochFee: Fee;
  nextEpochFee?: Fee | undefined;
  preferredDepositValidatorVoteAddress?: PublicKey | undefined;
  preferredWithdrawValidatorVoteAddress?: PublicKey | undefined;
  stakeDepositFee: Fee;
  stakeWithdrawalFee: Fee;
  nextWithdrawalFee?: Fee | undefined;
  stakeReferralFee: number;
  solDepositAuthority?: PublicKey | undefined;
  solDepositFee: Fee;
  solReferralFee: number;
  solWithdrawAuthority?: PublicKey | undefined;
  solWithdrawalFee: Fee;
  nextSolWithdrawalFee?: Fee | undefined;
  lastEpochPoolTokenSupply: BN;
  lastEpochTotalLamports: BN;
  rateOfExchange?: RateOfExchange | undefined;
  treasuryFeeAccount: PublicKey;
  treasuryFee: Fee;
  totalLamportsLiquidity: BN;
}

export const DAO_STATE_LAYOUT = struct<DaoState>([bool('isEnabled')]);
export const COMMUNITY_TOKEN_LAYOUT = struct<CommunityToken>([publicKey('tokenMint')]);

export const STAKE_POOL_LAYOUT = struct<StakePool>([
  // rustEnum(AccountTypeKind, 'accountType'),
  u8('accountType'),
  publicKey('manager'),
  publicKey('staker'),
  publicKey('stakeDepositAuthority'),
  u8('stakeWithdrawBumpSeed'),
  publicKey('validatorList'),
  publicKey('reserveStake'),
  publicKey('poolMint'),
  publicKey('managerFeeAccount'),
  publicKey('tokenProgramId'),
  u64('totalLamports'),
  u64('poolTokenSupply'),
  u64('lastUpdateEpoch'),
  struct([u64('unixTimestamp'), u64('epoch'), publicKey('custodian')], 'lockup'),
  struct(feeFields, 'epochFee'),
  option(struct(feeFields), 'nextEpochFee'),
  option(publicKey(), 'preferredDepositValidatorVoteAddress'),
  option(publicKey(), 'preferredWithdrawValidatorVoteAddress'),
  struct(feeFields, 'stakeDepositFee'),
  struct(feeFields, 'stakeWithdrawalFee'),
  option(struct(feeFields), 'nextWithdrawalFee'),
  u8('stakeReferralFee'),
  option(publicKey(), 'solDepositAuthority'),
  struct(feeFields, 'solDepositFee'),
  u8('solReferralFee'),
  option(publicKey(), 'solWithdrawAuthority'),
  struct(feeFields, 'solWithdrawalFee'),
  option(struct(feeFields), 'nextSolWithdrawalFee'),
  u64('lastEpochPoolTokenSupply'),
  u64('lastEpochTotalLamports'),
  option(struct(rateOfExchangeFields), 'rateOfExchange'),
  publicKey('treasuryFeeAccount'),
  struct(feeFields, 'treasuryFee'),
  u64('totalLamportsLiquidity'),
]);

export interface ValidatorStakeInfo {
  status: number;
  voteAccountAddress: PublicKey;
  activeStakeLamports: BN;
  transientStakeLamports?: BN;
  transientSeedSuffixStart?: BN;
  transientSeedSuffixEnd?: BN;
  lastUpdateEpoch: BN;
}

export const VALIDATOR_STAKE_INFO_LAYOUT = struct<ValidatorStakeInfo>([
  /// Amount of active stake delegated to this validator
  /// Note that if `last_update_epoch` does not match the current epoch then
  /// this field may not be accurate
  u64('activeStakeLamports'),
  /// Amount of transient stake delegated to this validator
  /// Note that if `last_update_epoch` does not match the current epoch then
  /// this field may not be accurate
  u64('transientStakeLamports'),
  /// Last epoch the active and transient stake lamports fields were updated
  u64('lastUpdateEpoch'),
  /// Start of the validator transient account seed suffixes
  u64('transientSeedSuffixStart'),
  /// End of the validator transient account seed suffixes
  u64('transientSeedSuffixEnd'),
  /// Status of the validator stake account
  // rustEnum([
  //   struct([], 'Active'),
  //   struct([], 'DeactivatingTransient'),
  //   struct([], 'ReadyForRemoval'),
  // ]).replicate('status'),
  u8('status'),
  /// Validator vote account address
  publicKey('voteAccountAddress'),
]);

export interface ValidatorList {
  /// Account type, must be ValidatorList currently
  accountType: number;
  /// Maximum allowable number of validators
  maxValidators: number;
  /// List of stake info for each validator in the pool
  validators: ValidatorStakeInfo[];
}

export const VALIDATOR_LIST_LAYOUT = struct<ValidatorList>([
  // rustEnum([
  //   struct([], 'Uninitialized'),
  //   struct([], 'StakePool'),
  //   struct([], 'ValidatorList'),
  // ]).replicate('accountType'),
  u8('accountType'),
  u32('maxValidators'),
  vec(VALIDATOR_STAKE_INFO_LAYOUT, 'validators'),
]);

export enum ValidatorStakeInfoStatus {
  Active,
  DeactivatingTransient,
  ReadyForRemoval,
}

export interface ReferrerInfo {
  pubKey: PublicKey;
}

export interface ReferrerList {
  accountType: number;
  maxReferrers: number;
  referrers: ReferrerInfo[];
}

export const REFERRER_INFO_LAYOUT = struct<ReferrerInfo>([
  publicKey("pubKey")
]);

export const REFERRER_LIST_LAYOUT = struct<ReferrerList>([
  u8("accountType"),
  u32("maxReferrers"),
  vec(REFERRER_INFO_LAYOUT, "referrers"),
]);
