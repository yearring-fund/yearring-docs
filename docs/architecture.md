# Architecture

The protocol is organized in three layers. Each layer has a single responsibility. No layer modifies the accounting of the layer below it.

```
┌─────────────────────────────────────────────────────────┐
│  PortfolioLensV21         EligibilityModuleV21           │  Read / Aggregation
├─────────────────────────────────────────────────────────┤
│  LockManagerV21           PointsLedgerV01                │  Commitment Layer
│  RebateManagerV21                                        │
├─────────────────────────────────────────────────────────┤
│  YearRingCoreVaultV21     CoreStrategyManagerV21         │  Capital Layer
│  AccessStrategyManagerV21 AaveUSDCStrategyV21            │
│  TreasuryV21                                             │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Capital Layer

Responsible for all user-facing fund accounting and share ownership.

**Contracts:** `YearRingCoreVaultV21`, `CoreStrategyManagerV21`, `AccessStrategyManagerV21`, `AaveUSDCStrategyV21`, `TreasuryV21`

**Responsibilities:**
- ERC-4626 share accounting (`yrUSDC`)
- User deposit and redeem flow
- On-chain reserve band enforcement: MIN 5% / TARGET 10% / MAX 15% — auto-rebalance on every deposit and withdrawal
- Allowlist / access control (`allowlistEnabled` + `allowlist(address)`)
- System mode: Normal (0) / Paused (1) / Emergency Mode (2)
- Management fee accrual (50 bps/year, accrued in CoreStrategyManagerV21 as PPS dilution)
- NAV and PPS derived from `convertToAssets()` — never set directly

**Price Per Share** is derived, not set:

```
PPS = convertToAssets(1e18)
    → returns USDC amount (6 decimals) for 1 full yrUSDC share
```

**totalAssets** is computed bottom-up:

```
totalAssets()
  = vault idle USDC
  + coreStrategyManager.totalManagedAssets()

totalManagedAssets()
  = strategyManager idle USDC
  + strategy.totalUnderlying()    // aToken balance in Aave V3
```

---

## Layer 2 — Commitment Layer

Coordinates long-term capital behavior without modifying vault accounting.

**Contracts:** `LockManagerV21`, `PointsLedgerV01`, `RebateManagerV21`

**Responsibilities:**
- Lock-based incentives (30–365 days, three tiers: Bronze / Silver / Gold)
- Non-transferable internal Points issued at lock time (`PointsLedgerV01`)
- Points are credited/debited via `PointsCredited` / `PointsDebited` events — not ERC-20 transfers
- Management fee rebate in USDC (linear accrual, claimed via `RebateManagerV21`)

**Lock tiers:**

| Tier | Duration |
|---|---|
| Bronze | 30–89 days |
| Silver | 90–179 days |
| Gold | 180–365+ days |

Lock positions are recorded in `LockManagerV21`. Locked `yrUSDC` continues to appreciate via PPS during the lock period. Points are non-transferable and have no guaranteed market value.

---

## Layer 3 — Read / Aggregation Layer

Read-only aggregation. No state modification.

**Contracts:** `PortfolioLensV21`, `EligibilityModuleV21`

**Responsibilities:**
- `PortfolioLensV21`: aggregated view of vault state, lock positions, pending rewards, and manager info
- `EligibilityModuleV21`: checks lock eligibility for AccessStrategyManagerV21 entry

---

## Governance and Access Control

| Role | Scope (V2.1 Beta) |
|---|---|
| DEFAULT_ADMIN_ROLE | All admin, keeper, and emergency roles held by monitored operator address during beta |
| EMERGENCY_ROLE | Activate Emergency Mode (systemMode=2) — does not add operator withdrawal path |
| Timelock + multisig | Planned hardening step before broader public access — not yet in V2.1 beta |

Emergency controls are limited to pause and Emergency Mode. They do not add a direct operator withdrawal path for user principal.

---

## Emergency Mode

| Mode | Deposits | Withdrawals | Notes |
|---|---|---|---|
| Normal (0) | Open | Open | Full operation |
| Paused (1) | Blocked | Open | Deposits stopped; redemptions remain open |
| Emergency Mode (2) | Blocked | Blocked | Deposits and withdrawals frozen pending resolution |

In Emergency Mode (`systemMode=2`), deposits and withdrawals are frozen while accounting, liquidity, or strategy risk is reviewed. Emergency controls are defined in the V2.1 contracts and do not add a direct operator withdrawal path for user principal.
