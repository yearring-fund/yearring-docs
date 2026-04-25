# Whitepaper

**YearRing Fund Protocol — On-chain fund infrastructure with programmable capital commitment**

Version 0.1 — April 2026

---

## Abstract

YearRing is an on-chain fund protocol deployed on Base. It accepts USDC deposits, issues ERC-4626 shares (fbUSDC), and deploys capital into conservative yield strategies — currently Aave V3 USDC supply.

On top of the vault sits a commitment layer: users can lock their shares for 30–365 days across three tiers (Bronze, Silver, Gold). Locking earns upfront reward tokens (RWT) and a management fee rebate. Early exit returns the full principal but requires returning all issued RWT. The protocol also provides a beneficiary mechanism — a designated address can inherit locked positions if the original owner becomes inactive.

The vault and the commitment layer have separate accounting. Vault yield comes from strategy performance; it does not depend on the reward token. The commitment layer uses RWT to coordinate long-term capital behavior, not to generate yield.

---

## 1. Problem

On-chain yield products are designed for liquidity. Users deposit, earn yield, and withdraw at will. This works for individual participants, but creates a problem for fund operators: there is no mechanism to distinguish capital that will stay for a year from capital that will leave tomorrow. Asset allocation decisions require duration assumptions, but the protocol has no way to obtain them.

Lock-up mining schemes attempted to solve this by issuing tokens as yield supplements. The result: users lock capital to farm tokens, dump them on unlock, and leave. The protocol acquires short-term mercenary capital dressed up as commitment.

The missing piece is a commitment mechanism where:

- commitment depth is measurable on-chain (duration, tier, locked share count)
- breaking commitment has a real, non-punitive cost (return the reward, keep the principal)
- vault yield operates independently of any token issuance

---

## 2. Architecture

The protocol is organized in three layers. Each layer has a single responsibility. No layer modifies the accounting of the layer below it.

```
┌─────────────────────────────────────────────────────────┐
│  BeneficiaryModule        UserStateEngine                │  User-facing
│  MetricsLayer             LockPoints (reserved)          │
├─────────────────────────────────────────────────────────┤
│  LockRewardManager        LockBenefit                    │  Commitment layer
│  LockLedger                                              │
├─────────────────────────────────────────────────────────┤
│  FundVault (fbUSDC)       StrategyManager                │  Capital layer
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Capital layer** handles deposits, redemptions, share accounting, strategy deployment, and fee collection. It follows the ERC-4626 standard and knows nothing about locks, tiers, or reward tokens.

**Commitment layer** receives fbUSDC shares from users, holds them in custody for a fixed duration, classifies positions into tiers, issues RWT, and manages fee rebates.

**User-facing layer** aggregates state across modules into a single read call, tracks beneficiary designations, and computes protocol-wide metrics.

---

## 3. Vault

### 3.1 ERC-4626 Share Accounting

The vault accepts USDC (6 decimals) and mints fbUSDC shares (18 decimals). The 12-decimal offset prevents share price inflation attacks on small deposits.

Price per share (PPS) is derived, never set:

```
PPS = totalAssets() / totalSupply()
```

There is no `setTotalAssets()`, `setPps()`, `adminMintShares()`, or `adminBurnUserShares()`. These interfaces are prohibited by design.

### 3.2 totalAssets

```
totalAssets()
  = vault idle USDC
  + strategyManager.totalManagedAssets()

totalManagedAssets()
  = strategyManager idle USDC
  + strategy.totalUnderlying()

strategy.totalUnderlying()          [Aave V3]
  = aToken.balanceOf(strategy)      // includes accrued interest
  + idle USDC in strategy contract
```

Aave interest accrues via aToken rebase each block. As `aToken.balanceOf()` increases, `totalAssets()` rises, PPS appreciates, and all shareholders benefit proportionally.

### 3.3 Management Fee

The fund charges a management fee configured as `mgmtFeeBpsPerMonth`. The contract enforces a hard cap of 200 bps per month. The fee is collected through share dilution:

```
feeShares = totalSupply × mgmtFeeBps × elapsedTime
            / (BPS_DENOMINATOR × SECONDS_PER_MONTH)
```

New fbUSDC shares are minted to the treasury address. No USDC is deducted from user balances.

### 3.4 Deposits and Redemptions

Deposits and redemptions can be independently paused. Redemption is never gated by the allowlist — a user who deposited can always redeem, even if later removed from the allowlist or if deposits are paused.

---

## 4. Strategy

### 4.1 Current Strategy

The sole active strategy is Aave V3 USDC supply on Base. Yield comes from Aave's lending market supply rate. The protocol does not use leverage, recursive borrowing, or active trading.

### 4.2 Deployment Constraints

- **Hard cap**: max 70% of `totalAssets` deployable at any time (on-chain constant, not configurable)
- **Reserve ratio**: admin-set `reserveRatioBps` that must be satisfied before deployment is allowed

### 4.3 Reserve System

| Threshold | Value | Behavior |
|---|---|---|
| Floor | 15% | Below this, `rebalance()` pulls funds from strategy |
| Target | 30% | `rebalance()` refills to this level |
| Ceiling | 35% | Above this, new `invest()` calls are blocked |

`rebalance()` is permissionless with a 1-hour cooldown.

---

## 5. Commitment Layer

### 5.1 Lock Mechanics

Users lock fbUSDC shares for a fixed duration. Each position is recorded in the `LockLedger`:

```solidity
struct LockPosition {
    address owner;
    uint256 shares;
    uint64  lockedAt;
    uint64  unlockAt;
    bool    unlocked;
    bool    earlyExited;
}
```

Duration range: 30 to 365 days. Up to 5 active positions per user. Locked shares continue to appreciate via PPS.

### 5.2 Tiers

| Tier | Duration | Multiplier Range | Fee Discount |
|---|---|---|---|
| Bronze | 30–89 days | 1.0× – 1.3× | 20% |
| Silver | 90–179 days | 1.3× – 1.8× | 40% |
| Gold | 180–365 days | 1.8× – 2.5× | 60% |

### 5.3 Reward Tokens (RWT)

RWT is a fixed-supply ERC-20 token. Total supply: 1,000,000 RWT. No further minting is possible.

```
RWT issued = lockedUSDCValue × durationDays × multiplierBps / 5,000,000
```

RWT is not counted in `totalAssets()`. Its market value does not affect PPS.

### 5.4 Early Exit

Early exit returns the full principal. The user must return all RWT issued for that lock position. Partial return is not accepted.

---

## 6. Emergency Exit

### 6.1 System Modes

| Mode | Deposits | Redeems | Notes |
|---|---|---|---|
| Normal | Open | Open | Full operation |
| Paused | Blocked | Open | Exits always available |
| EmergencyExit | Blocked | Via Exit Round | Proportional claim mechanism |

### 6.2 Exit Round

In EmergencyExit mode, the admin opens an Exit Round. Strategy funds are withdrawn via `emergencyExit()`. Users call `claimExitAssets(roundId)` to burn shares and receive proportional USDC.

---

## 7. Beneficiary

Users with locked positions can designate a beneficiary. If the owner is inactive for 365 days, the beneficiary can claim and continue the locked positions under the original lock terms.

---

## 8. Governance and Permissions

All admin operations pass through a 24-hour `ProtocolTimelockV02`. `EMERGENCY_ROLE` can pause immediately but cannot reconfigure the system or redirect funds.

`GovernanceSignalV02` allows RWT holders to vote on proposals. Results are advisory only — no on-chain execution is triggered automatically.

---

## 9. Accounting Invariants

| Operation | totalAssets | totalSupply | PPS |
|---|---|---|---|
| Deposit | Increases | Increases | Unchanged |
| Redemption | Decreases | Decreases | Unchanged |
| Fee mint | Unchanged | Increases | Slight decrease |
| Aave interest | Increases | Unchanged | Increases |
| Lock / unlock | Unchanged | Unchanged | Unchanged |
| RWT distribution | Unchanged | Unchanged | Unchanged |
| Rebate claim | Unchanged | Unchanged | Unchanged |

---

## 10. Risk Disclosure

**Smart contract risk**: Contracts have not been formally audited by a third party. Testing does not eliminate all risk.

**Strategy risk**: Capital in Aave V3 is subject to Aave protocol risk. PPS may decrease if Aave suffers a loss.

**No guaranteed yield**: Yield depends on Aave supply rates, which may vary or reach zero.

**Operational risk**: Admin is currently a single entity. Full multisig governance is planned but not yet implemented.

**Liquidity risk**: Redemptions require sufficient idle USDC. Insufficient idle balance requires an admin divest action before redemption.

**RWT price risk**: RWT has no guaranteed market value.

---

## 11. Deployment

**Network**: Base Mainnet (Chain ID 8453)

See [Mainnet Contracts](/contracts) for full address list.

---

## 12. Version Roadmap

| Version | Scope |
|---|---|
| V2 (current) | Full commitment layer. Single strategy (Aave V3). Invited whitelist. Signal governance. |
| V3 | Production version. 24h timelock on all admin ops. Exit Round with locked share snapshots. |
| V4 (planned) | Second strategy interface. Automation for rebalance. |
| V5+ (planned) | Full DAO governance execution. RWA pathways. |

---

*YearRing Fund Protocol — Built on Base*
