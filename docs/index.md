---
layout: home

hero:
  name: "YearRing Fund Protocol"
  tagline: "ERC-4626 vault with long-term capital commitment — V2.1 Beta on Base."
  actions:
    - theme: brand
      text: Architecture
      link: /architecture
    - theme: alt
      text: Contracts
      link: /contracts
    - theme: alt
      text: Open App
      link: https://app.yearringfund.com

features:
  - title: ERC-4626 Core Vault
    details: Users deposit USDC and receive yrUSDC shares. Price Per Share (PPS) is derived from convertToAssets() — on-chain, transparent, not settable by admin.
  - title: Strategy Layer
    details: Capital is deployed through CoreStrategyManagerV21 into AaveUSDCStrategyV21 (Aave V3 USDC supply on Base). On-chain reserve band enforced — MIN 5% / TARGET 10% / MAX 15%.
  - title: Commitment Layer
    details: Users can lock yrUSDC shares for 30–365 days across Bronze, Silver, and Gold tiers. Locking earns non-transferable internal Points and a management fee rebate in USDC.
  - title: Emergency Controls
    details: systemMode=2 (Emergency Mode) freezes deposits and withdrawals while accounting, liquidity, or strategy risk is reviewed. Emergency controls do not add a direct operator withdrawal path for user principal.
---

## What This Protocol Does

YearRing Fund Protocol is an on-chain capital management protocol deployed on Base mainnet.

It accepts USDC deposits, issues ERC-4626 shares (`yrUSDC`), and deploys capital into conservative yield strategies with transparent, on-chain accounting. The current active strategy is Aave V3 USDC supply on Base.

On top of the vault sits a commitment layer that allows participants to lock positions for defined durations, earning non-transferable internal Points and management fee rebates.

## Current Status — V2.1 Beta

| Item | Status |
|---|---|
| Core Vault (YearRingCoreVaultV21 + CoreStrategyManagerV21 + AaveUSDCStrategyV21) | Deployed on Base Mainnet |
| Commitment layer (LockManagerV21 + PointsLedgerV01 + RebateManagerV21) | Deployed on Base Mainnet |
| Portfolio lens (PortfolioLensV21 + EligibilityModuleV21) | Deployed on Base Mainnet |
| Access | Invited allowlist — internal validation phase |
| External audit | Pending — in preparation |
| Governance (Timelock + multisig) | Planned — not yet in V2.1 beta |

> YearRing Fund Protocol is experimental software. Nothing in this documentation constitutes financial advice or an invitation to invest. Users should understand smart contract, DeFi, strategy, and regulatory risks before interacting with the protocol.
