---
layout: home

hero:
  name: "YearRing Fund Protocol"
  tagline: "On-chain fund and long-term capital coordination protocol on Base."
  actions:
    - theme: brand
      text: Architecture
      link: /architecture
    - theme: alt
      text: Mainnet Contracts
      link: /contracts
    - theme: alt
      text: Open App
      link: https://app.yearringfund.com

features:
  - title: ERC-4626 Vault
    details: Users deposit USDC and receive fbUSDC shares. Share price (PPS) is derived from totalAssets — transparent, on-chain, and not settable by admin.
  - title: Separated Strategy Layer
    details: Capital is deployed into approved external strategies via StrategyManagerV01. Currently integrated with Aave V3 USDC supply on Base.
  - title: Commitment Layer
    details: Users can lock fbUSDC shares for 30–365 days across Bronze, Silver, and Gold tiers. Locking earns RWT and a management fee rebate. Early exit returns full principal on return of RWT.
  - title: Emergency Exit
    details: The protocol supports three system modes — Normal, Paused, and EmergencyExit. Redemption is always prioritized. Emergency exit withdraws all strategy capital and allows proportional claims.
---

## What This Protocol Does

YearRing Fund Protocol is an on-chain fund and long-term capital coordination infrastructure deployed on Base.

It accepts USDC deposits, issues ERC-4626 shares (`fbUSDC`), and deploys capital into conservative yield strategies with transparent, on-chain accounting. On top of the vault sits a commitment layer that allows participants to signal long-term intent through verifiable, on-chain lock positions.

The protocol is not designed for short-term yield optimization. It is designed as a long-term capital container with transparent accounting, separated execution layers, and non-negotiable exit rights.

## Current Status

- **Deployed on Base mainnet** — vault, strategy (Aave V3), lock manager, beneficiary module
- **Access**: invited whitelist (internal validation phase)
- **External audit**: pending
- **No guaranteed yield** — yield comes from Aave V3 supply rates and may vary or decrease

> YearRing Fund Protocol is experimental software. Nothing in this documentation constitutes financial advice or an invitation to invest. Users should understand smart contract, DeFi, strategy, and regulatory risks before interacting with the protocol.
