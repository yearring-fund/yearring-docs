# Protocol Overview — V2.1 Beta

> This is a concise protocol overview for V2.1 Beta. A full litepaper is in preparation.

---

## What YearRing Fund Protocol Does

YearRing Fund Protocol is an on-chain capital management protocol deployed on Base Mainnet.

It accepts USDC deposits, issues ERC-4626 vault shares (`yrUSDC`), and deploys capital into conservative yield strategies with transparent, on-chain accounting. The current active strategy is Aave V3 USDC supply on Base.

On top of the vault sits a commitment layer that allows participants to lock positions for defined durations, earning non-transferable internal Points and management fee rebates in USDC.

---

## Protocol Design Principles

**Transparent accounting.** Price Per Share (PPS) is derived from `convertToAssets(1e18)` — computed bottom-up from on-chain balances. It is not settable by any admin.

**No off-chain state.** All deposit, redemption, lock, Points, and rebate accounting is on-chain and verifiable on BaseScan.

**Reserve band enforcement.** A MIN 5% / TARGET 10% / MAX 15% idle USDC band is enforced automatically on every deposit and withdrawal. This reduces liquidity risk without manually managing vault reserves.

**Conservative strategy scope.** V2.1 Beta uses a single strategy: Aave V3 USDC supply on Base. Strategy expansion requires governance and audit coverage.

**Controlled beta phase.** V2.1 Beta is in an invited allowlist phase. Access is not public. External audit is in preparation.

---

## Capital Flow

```
User deposits USDC
  → YearRingCoreVaultV21 mints yrUSDC shares (ERC-4626)
  → CoreStrategyManagerV21 deploys excess USDC to AaveUSDCStrategyV21
  → AaveUSDCStrategyV21 supplies USDC to Aave V3 (Base), receives aUSDC
  → Yield accrues in aToken balance → reflected in convertToAssets()

User redeems yrUSDC
  → YearRingCoreVaultV21 burns shares
  → If vault idle USDC is insufficient, CoreStrategyManagerV21 withdraws from strategy
  → User receives USDC proportional to share of totalAssets
```

---

## Commitment Layer

Users may optionally lock yrUSDC shares for a defined duration to access additional protocol incentives.

**Lock tiers:**

| Tier | Duration |
|---|---|
| Bronze | 30–89 days |
| Silver | 90–179 days |
| Gold | 180–365+ days |

**What locking provides:**
- Non-transferable internal Points, credited at lock time via `PointsLedgerV01`
- Management fee rebate in USDC (linear accrual, claimed via `RebateManagerV21`)

**What locking does not change:**
- Locked yrUSDC continues to appreciate via PPS during the lock period
- Lock does not affect the underlying Aave strategy or vault accounting

Points have no guaranteed market value and are not ERC-20 tokens.

---

## Management Fee

A 50 bps/year management fee accrues as PPS dilution in `CoreStrategyManagerV21`. The fee is reflected in the share price — it is not deducted directly from user USDC balances. Lock participants can earn a partial rebate of this fee in USDC through `RebateManagerV21`.

---

## Governance and Access Control (V2.1 Beta)

All admin, keeper, and emergency roles are held by a monitored operator address during the beta phase. This concentrates control during the validation period to allow rapid response.

Planned governance hardening (Timelock + multisig) is not yet deployed. The current status of all governance roles is:

| Role | V2.1 Beta State |
|---|---|
| DEFAULT_ADMIN_ROLE | Monitored operator address |
| EMERGENCY_ROLE | Monitored operator address |
| Timelock | Planned — not yet deployed |
| Multisig | Planned — not yet deployed |

---

## Emergency Controls

| Mode | Deposits | Withdrawals |
|---|---|---|
| Normal (0) | Open | Open |
| Paused (1) | Blocked | Open |
| Emergency Mode (2) | Blocked | Blocked |

Emergency Mode (`systemMode=2`) freezes deposits and withdrawals while accounting, liquidity, or strategy risk is reviewed. Emergency controls do not add a direct operator withdrawal path for user principal.

---

## Current Deployment

All contracts are on Base Mainnet. See [Mainnet Contracts](/contracts) for addresses.

| Component | Status |
|---|---|
| Core Vault + Strategy | Deployed |
| Commitment Layer | Deployed |
| Portfolio Lens | Deployed |
| External Audit | Pending — in preparation |
| Timelock + Multisig | Planned |

> YearRing Fund Protocol is experimental software. Nothing in this documentation constitutes financial advice or an invitation to invest. Users should understand smart contract, DeFi, strategy, and regulatory risks before interacting with the protocol.

[← Back to Overview](/)
