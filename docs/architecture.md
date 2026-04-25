# Architecture

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

---

## Layer 1 — Capital Layer

The vault layer handles all user-facing fund accounting and share ownership.

**Responsibilities:**
- user deposit and redeem flow
- ERC-4626 share accounting (`fbUSDC`)
- reserve management
- allowlist / access control
- emergency mode and exit round logic
- management fee accounting
- NAV and share-value calculation

**Share price (PPS)** is derived, never set:

```
PPS = totalAssets() / totalSupply()
```

**totalAssets** is computed bottom-up:

```
totalAssets()
  = vault idle USDC
  + strategyManager.totalManagedAssets()

totalManagedAssets()
  = strategyManager idle USDC
  + strategy.totalUnderlying()      // aToken.balanceOf(strategy) + accrued interest
```

**Main contracts:** `FundVaultV01`

---

## Layer 2 — Strategy Execution Layer

The strategy layer deploys vault capital into approved external protocols.

**Responsibilities:**
- receiving capital from the vault
- investing into approved external protocols
- divesting and returning assets to the vault
- enforcing strategy caps and execution limits
- isolating strategy execution risk from the vault layer

**Deployment constraints:**
- Hard cap: max 70% of totalAssets can be deployed at any time (on-chain constant, not configurable)
- Reserve ratio: admin-set target that must be maintained before any deploy is allowed

**Main contracts:** `StrategyManagerV01`, `AaveV3StrategyV01`

---

## Layer 3 — Commitment / Reward Layer

The commitment layer coordinates long-term capital behavior without modifying vault accounting.

**Responsibilities:**
- lock-based incentives (30–365 days, three tiers)
- reward token (RWT) issuance and return
- management fee rebate calculation and settlement
- beneficiary designation and claim logic
- long-term participation tracking (points)

**Lock tiers:**

| Tier | Duration | Fee Discount |
|---|---|---|
| Bronze | 30–89 days | 20% |
| Silver | 90–179 days | 40% |
| Gold | 180–365 days | 60% |

Lock and unlock are ERC-20 transfers of fbUSDC between user wallets and the LockLedger. No vault accounting is affected.

**Main contracts:** `RewardToken`, `LockRewardManagerV02`, `LockLedgerV02`

---

## Governance and Access Control

| Role | Holder | Scope |
|---|---|---|
| DEFAULT_ADMIN_ROLE | Admin via 24h Timelock | Parameter changes, mode recovery, role management |
| EMERGENCY_ROLE | Dedicated address | Pause and emergency operations only |
| UPGRADER_ROLE | Admin | Strategy contract upgrades |
| PROPOSER_ROLE | Governance proposer | Create signal votes |

EMERGENCY_ROLE is a brake pedal, not a steering wheel. It can pause and trigger emergency exit, but cannot modify parameters, redirect funds, or recover the system to normal state.

**Main contracts:** `GovernanceSignalV02`, `ProtocolTimelockV02`

---

## Emergency Exit Flow

The protocol supports three system modes: Normal, Paused, and EmergencyExit.

| Mode | Deposits | Redeems | Notes |
|---|---|---|---|
| Normal | Open | Open | Full operation |
| Paused | Blocked | Open | Deposits stopped; exits always available |
| EmergencyExit | Blocked | Via Exit Round | Full withdrawal through claim mechanism |

In EmergencyExit mode, the admin opens an Exit Round. Users call `claimExitAssets(roundId)` to burn shares and receive proportional USDC. Strategy funds are withdrawn via `emergencyExit()` before or during this process.
