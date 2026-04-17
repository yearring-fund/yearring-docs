# YearRing Fund Protocol

**On-chain fund infrastructure with programmable capital commitment**

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

- Commitment depth is measurable on-chain (duration, tier, locked share count)
- Breaking commitment has a real, non-punitive cost (return the reward, keep the principal)
- Vault yield operates independently of any token issuance

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

There is no `setTotalAssets()`, `setPps()`, `adminMintShares()`, or `adminBurnUserShares()` function. These interfaces are prohibited by design and will not be introduced in any version.

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

What counts toward totalAssets:

| Asset | Included | Reason |
|---|---|---|
| USDC held by vault | Yes | Direct holding |
| USDC held by strategy manager | Yes | In transit |
| aUSDC (with accrued interest) | Yes | strategy.totalUnderlying() |
| RewardToken (RWT) | No | Independent token, not a fund asset |
| Locked fbUSDC shares | No | Already reflected in PPS |

Aave interest accrues via aToken rebase each block. As `aToken.balanceOf()` increases, `totalAssets()` rises, PPS appreciates, and all shareholders benefit proportionally. If Aave incurs a loss, the reverse occurs — this is by design.

### 3.3 Management Fee

The fund charges a management fee configured as `mgmtFeeBpsPerMonth`. The current production rate is 9 bps per month (~1.08% annualized). The contract enforces a hard cap of 200 bps per month. The fee is collected through share dilution:

```
feeShares = totalSupply × mgmtFeeBps × elapsedTime
            / (BPS_DENOMINATOR × SECONDS_PER_MONTH)
```

New fbUSDC shares are minted to the treasury address. This increases `totalSupply`, diluting existing holders proportionally. `totalAssets` is not affected. No USDC is deducted from anyone's balance.

### 3.4 Deposits and Redemptions

Deposits and redemptions can be independently paused. Redemption is never gated by the allowlist — a user who was allowed to deposit can always redeem, even if later removed from the allowlist or if deposits are paused.

In the current access model, deposits require allowlist approval (invited whitelist). This is an operational constraint, not a permanent architectural choice.

---

## 4. Strategy

### 4.1 Current Strategy

The sole active strategy is Aave V3 USDC supply on Base. The strategy contract deposits USDC into Aave and receives aUSDC. Yield comes from Aave's lending market supply rate.

The protocol does not use leverage, recursive borrowing, or active trading. It does not interact with unaudited protocols. These restrictions apply to all versions.

### 4.2 Deployment Constraints

Strategy deployment is bounded by two independent mechanisms:

**Hard cap**: No more than 70% of totalAssets can be deployed to strategies at any time. This is an on-chain constant (`MAX_STRATEGY_DEPLOY_BPS = 7000`), not configurable by admin.

**Reserve ratio**: The admin sets a `reserveRatioBps` that determines how much USDC the vault must retain. At the default value of 100% (10,000 bps), no capital can be deployed. The admin must explicitly lower this to enable strategy deployment.

Both constraints are checked simultaneously; the stricter one applies.

### 4.3 Reserve System

The protocol maintains a three-tier reserve system with fixed thresholds:

| Threshold | Value | Behavior |
|---|---|---|
| Floor | 15% | Below this, `rebalance()` pulls funds from strategy |
| Target | 30% | `rebalance()` refills to this level |
| Ceiling | 35% | Above this, new `invest()` calls are blocked |

Reserve ratio = vault idle USDC / totalAssets().

`rebalance()` is permissionless — any address can call it. There is a 1-hour cooldown between calls. If the reserve is between 15% and 35%, the call is a no-op. If the reserve is above 35%, the function does not auto-invest; deployment remains an admin action.

These thresholds are fixed constants, not configurable by admin. They operate independently from the admin-controlled `reserveRatioBps`.

---

## 5. Commitment Layer

### 5.1 Lock Mechanics

Users lock fbUSDC shares (not USDC) into the LockLedger for a fixed duration. Each lock is recorded as an independent position:

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

Duration range: 30 to 365 days. Each user can hold up to 5 active lock positions simultaneously. Positions are independent — each has its own expiration, tier, RWT allocation, and rebate accrual.

Locked shares continue to appreciate via PPS. On unlock, the user receives back the original share count; the USDC value of those shares reflects any yield earned during the lock period. Locking does not create a second yield stream — the vault yield applies equally to locked and free shares.

### 5.2 Tiers

Lock positions are classified into three tiers based on duration:

| Tier | Duration | Multiplier Range | Fee Discount |
|---|---|---|---|
| Bronze | 30–89 days | 1.0× – 1.3× | 20% |
| Silver | 90–179 days | 1.3× – 1.8× | 40% |
| Gold | 180–365 days | 1.8× – 2.5× | 60% |

Within each tier, the multiplier is linearly interpolated based on exact duration:

```
multiplierBps = baseMult + (maxMult - baseMult)
                × (durationSeconds - tierMinSeconds)
                / (tierMaxSeconds - tierMinSeconds)
```

The interpolation is continuous at tier boundaries: Bronze at 89 days yields the same multiplier as Silver at 90 days (both 1.3×). Similarly, Silver at 179 days matches Gold at 180 days (both 1.8×).

### 5.3 Reward Tokens (RWT)

RWT is a fixed-supply ERC-20 token. Total supply: 1,000,000 RWT (18 decimals), pre-minted to treasury at deployment. No further minting is possible.

When a user locks shares, RWT is issued from the treasury. The amount is calculated once at lock time and does not change:

```
RWT issued = lockedUSDCValue × durationDays × multiplierBps
             / REWARD_DENOMINATOR

REWARD_DENOMINATOR = 10,000 × 500 = 5,000,000
```

`lockedUSDCValue` is the USDC equivalent of the locked shares at lock time (shares × PPS).

Example: locking the equivalent of 1,000 USDC for 180 days at Gold (1.8×) yields:

```
1,000 × 180 × 18,000 / 5,000,000 = 648 RWT
```

At calibration: 1 USDC locked for 1 day at Bronze baseline (1.0×) yields 0.002 RWT.

RWT is not counted in `totalAssets()`. Its market value does not affect PPS. If RWT price drops to zero, vault accounting is unaffected.

### 5.4 Fee Rebate

Locked users receive a partial refund of the management fee as fbUSDC shares:

```
rebateShares = lockedShares × mgmtFeeBps × discountBps × elapsedSeconds
               / (BPS_DENOMINATOR² × SECONDS_PER_MONTH)
```

The rebate accrues linearly from lock creation to expiration. Users can claim it at any time via `claimRebate(lockId)`. The source is treasury's fbUSDC shares — no new shares are minted, and `totalAssets` is unaffected.

After unlock or early exit, no further rebate accrues. Rebate already claimed before early exit is kept.

### 5.5 Early Exit

A user can exit a lock before maturity. The principal (locked fbUSDC shares) is returned in full — there is no haircut. However, the user must return all RWT that was issued for that lock position. Any accrued rebate is auto-settled before the exit.

The flow:

1. Auto-settle accrued rebate (fbUSDC from treasury to user)
2. Transfer issued RWT from user back to treasury
3. Release locked fbUSDC shares back to user
4. Mark position as early-exited

If the user does not hold sufficient RWT or has not approved the transfer, the transaction reverts. Partial RWT return is not accepted.

This creates a clear cost structure: breaking commitment costs the reward, not the capital.

### 5.6 Points

Each lock position accrues a time-weighted score computed on read:

```
points = lockedUSDCValue × elapsedDays × multiplierBps / 5,000,000
```

Points accumulate linearly during the lock and freeze at unlock. They are not burned or reduced. In the current version, points are a weight basis reserved for future use and are not exposed as a user-facing incentive.

---

## 6. Emergency Exit

### 6.1 System Modes

The protocol operates in one of three modes:

| Mode | Deposits | Redeems | Strategy Ops | Lock Ops |
|---|---|---|---|---|
| Normal | Open | Open | All allowed | All allowed |
| Paused | Blocked | Open | invest() blocked | Blocked |
| EmergencyExit | Blocked | Blocked (use Exit Round) | emergencyExit() only | earlyExit only |

Transitions:

```
Normal  →  Paused            (EMERGENCY_ROLE)
Paused  →  EmergencyExit     (EMERGENCY_ROLE)
Normal  →  EmergencyExit     (Admin via timelock)
EmergencyExit  →  Normal     (Admin via timelock, after assessment)
```

In Paused mode, redemptions remain open. Users can always withdraw — pausing stops new inflow, not exit.

### 6.2 Exit Round

When the system enters EmergencyExit, the admin can open an Exit Round:

1. **Snapshot**: `openExitRound()` captures each user's free fbUSDC balance. The V3 design extends this to also include locked shares via `lockedSharesOfAt()`, so that locked users' economic stake is counted without requiring them to unlock first. (Implementation status of the locked-share snapshot is pending V3 contract finalization.)
2. **Strategy withdrawal**: `emergencyExit()` converts all aUSDC back to USDC and returns it to the vault.
3. **Proportional claim**: Users call `claimExitAssets(roundId)` to burn their shares and receive USDC proportional to their snapshot balance.

```
claimable USDC = totalRoundUSDC × userSnapshotShares / totalSnapshotShares
```

To claim, a locked user must first call `earlyExitWithReturn()` to get their fbUSDC back, then burn those shares via `claimExitAssets()`.

If a locked user does not early-exit before a round closes, their shares remain in the LockLedger. They can claim in a future round or wait for natural maturity.

Multiple rounds can be opened sequentially if assets return in phases.

---

## 7. Beneficiary

Users with locked positions can designate a beneficiary address. If the original owner becomes inactive, the beneficiary can claim and continue the locked positions.

### 7.1 Inactivity Condition

The owner is considered inactive after 365 days of no heartbeat. Only `heartbeat()`, `setBeneficiary()`, `updateBeneficiary()`, and `revokeBeneficiary()` reset the timer. Deposits, redemptions, and other protocol actions do not.

An admin override (`adminMarkInactive`) can bypass the time check.

If a user has never called any of the above functions, `lastActiveAt = 0`, and the user is not considered inactive — the timer must be explicitly started.

### 7.2 Claim Execution

When the inactivity condition is met, the beneficiary calls `executeClaim(originalOwner, lockIds)`:

- Each specified lock position's `owner` field is updated to the beneficiary address
- Lock terms are preserved: same `unlockAt`, same share count, same `lockedAt`
- The beneficiary can unlock at maturity under the original schedule

What transfers: locked positions (fbUSDC held in LockLedger).

What does not transfer in the current version: free fbUSDC in the original owner's wallet, accumulated points (points remain with the original owner's address).

One claim per original owner. After claim, no further beneficiary actions for that owner.

---

## 8. Governance and Permissions

### 8.1 Roles

| Role | Holder | Purpose |
|---|---|---|
| DEFAULT_ADMIN_ROLE | Multisig, via 24h Timelock | Parameter changes, mode recovery, role management |
| EMERGENCY_ROLE | Dedicated address | Pause and emergency operations only |
| UPGRADER_ROLE | Multisig | Strategy contract upgrades |
| PROPOSER_ROLE | Governance proposer | Create signal votes |

### 8.2 EMERGENCY_ROLE

Can: pause deposits, pause redeems, set mode to Paused or EmergencyExit, trigger strategy emergency exit, pause lock modules.

Cannot: modify fee rates, change reserve parameters, switch strategies, recover from Paused/EmergencyExit to Normal, mint or burn shares, modify user balances, redirect emergency exit funds to any address other than the vault.

Design principle: EMERGENCY_ROLE is a brake pedal, not a steering wheel.

### 8.3 Admin via Timelock

All DEFAULT_ADMIN_ROLE operations pass through a 24-hour TimelockController. The multisig schedules the operation, waits 24 hours, then executes.

Admin can (after timelock): change management fee rate, switch strategy, adjust reserve parameters, recover system mode, open/close exit rounds, grant/revoke roles.

Admin cannot (in any version, with or without timelock): set NAV or PPS directly, mint or burn user shares, redirect emergency exit funds.

### 8.4 Governance Signal

GovernanceSignal allows RWT holders to vote on proposals. Voting power is determined by RWT balance at the snapshot taken when a proposal is created.

This is signal voting only. Results are advisory. A passing vote does not trigger any on-chain execution. The admin reviews results and may act through the normal timelock process.

The protocol does not claim to be fully decentralized. Admin multisig control exists and is explicitly acknowledged.

---

## 9. Accounting Invariants

The following invariants hold across all protocol operations:

| Operation | totalAssets | totalSupply | PPS |
|---|---|---|---|
| Deposit | Increases | Increases | Unchanged |
| Redemption | Decreases | Decreases | Unchanged |
| Fee mint | Unchanged | Increases | Slight decrease (dilution) |
| Aave interest accrual | Increases | Unchanged | Increases |
| Lock/unlock | Unchanged | Unchanged | Unchanged |
| RWT distribution | Unchanged | Unchanged | Unchanged |
| Rebate claim | Unchanged | Unchanged | Unchanged |

Lock and unlock operations transfer fbUSDC between user wallets and the LockLedger contract. These are ERC-20 transfers of existing shares — no minting, no burning, no change to vault accounting.

RWT issuance and return are transfers of a separate ERC-20 token between treasury and user. They do not touch the vault.

Rebate claims are fbUSDC transfers from treasury to user. The shares already exist in the treasury's balance. No new shares are created.

---

## 10. Risk Disclosure

**Smart contract risk**: The protocol contracts have not been formally audited by a third party. The test suite covers 613 cases across vault accounting, access control, emergency paths, and commitment operations. Testing does not eliminate all contract risk.

**Strategy risk**: Vault capital deployed to Aave V3 is subject to Aave protocol risk (smart contract bugs, governance actions, market conditions). If Aave's aUSDC balance decreases, PPS decreases proportionally.

**Operational risk**: Admin operations (strategy deployment, fee changes, mode transitions) are controlled by a multisig with a 24-hour timelock. The emergency role can pause immediately but cannot reconfigure the system. In the current version, the admin is a single entity — full multisig governance is planned but not yet implemented.

**Fee rebate source risk**: Rebates are paid from the treasury's fbUSDC balance. If the treasury is depleted, rebate claims and early exit settlements will revert until the treasury is replenished.

**Liquidity risk**: Redemptions require sufficient idle USDC in the vault. If the vault's idle balance is insufficient, the user must wait for a `rebalance()` call to pull funds from the strategy, or for an admin `divest()` action.

**RWT price risk**: RWT has no guaranteed market value. Its price is determined by secondary market trading, if any. The protocol does not provide liquidity guarantees for RWT.

---

## 11. Deployment

**Network**: Base Mainnet (Chain ID 8453)

**Core contracts**:

| Contract | Address |
|---|---|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| FundVault (fbUSDC) | `0x9dD61ee543a9C51aBe7B26A89687C9aEeea98a54` |
| StrategyManager | `0xa44d3b9b0ECD6fFa4bD646957468c0B5Bfa64A54` |
| AaveV3Strategy | `0x621CC4189946128eF2d584F69bb994C84FcA612D` |
| RewardToken (RWT) | `0xeAb54e7cFbE5d35ea5203854B44C8516201534A9` |

**Commitment contracts**:

| Contract | Address |
|---|---|
| LockLedger | `0x2D95517Cc375ab2dc6433fd44A8706462A418a89` |
| LockBenefit | `0x083C50F9996b8E1389eB4506e24A2A22Df2C6e1c` |
| LockRewardManager | `0xb29DeFCF75f71bc4DaFaA353cE294C284F5e07cB` |
| BeneficiaryModule | `0x0dA3955C58D3252012A76D5CC01E9cc4dfF05C00` |
| UserStateEngine | `0x083A92c65A7f586Bc7B8D3D24EE831C217298e18` |
| MetricsLayer | `0x1C4Ba691688db06a63AfCde29FF377394BF530F1` |

**Governance contracts**:

| Contract | Address |
|---|---|
| GovernanceSignal | `0x9BE5636943d7BfF57ACA6047Cf945FD770CcC7d0` |
| ProtocolTimelock | `0x054Cb2c32D6062B291420584dE2e5952C372cDD6` |
| ClaimLedger | `0x5CF9b8EC75314115EDDE5Dd332C193995Dd55234` |

**Operational addresses**:

| Role | Address |
|---|---|
| Admin | `0x087ea7F67d9282f0bdC43627b855F79789C6824C` |
| Guardian (Emergency) | `0xC8052cF447d429f63E890385a6924464B85c5834` |
| Treasury | `0x9d16Eb6A6143A3347f8fA5854B5AA675101Fb705` |

**Build**: Solidity ^0.8.20, OpenZeppelin v4, Hardhat

---

## 12. Version Roadmap

| Version | Scope |
|---|---|
| V2 (current) | Full commitment layer, demo-grade. Single strategy (Aave V3). Invited whitelist access. Signal governance. |
| V3 | Production version. Linear interpolation multipliers. Three-tier reserve constants. 24h timelock on all admin ops. Exit Round with locked share snapshots. |
| V4 (planned) | Second strategy interface. Chainlink Automation for rebalance. |
| V5+ (planned) | Full DAO governance execution. RWA pathways. |

---

*YearRing Fund Protocol — Built on Base*
