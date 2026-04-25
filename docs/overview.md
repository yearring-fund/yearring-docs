# Overview

YearRing Fund Protocol is an on-chain fund and long-term capital coordination protocol built on Base.

It is designed for users who want transparent, rules-based, compounding-oriented asset management — without relying on off-chain intermediaries, custodians, or fund administrators.

---

## What It Does

Users deposit USDC into the vault and receive **fbUSDC** — ERC-4626 shares backed by the vault's assets. The vault deploys USDC into approved yield strategies, currently Aave V3 USDC supply on Base.

On top of the vault sits a **commitment layer**: users can voluntarily lock their fbUSDC shares for 30 to 365 days across three tiers (Bronze, Silver, Gold). Locking earns upfront reward tokens (RWT) and a management fee rebate. Exiting early returns the full principal but requires returning all issued RWT.

The vault and commitment layer have **separate accounting**. Vault yield comes from strategy performance and does not depend on the reward token. The commitment layer uses RWT to coordinate long-term capital behavior — not to generate yield.

---

## Core Design Principles

**The vault is the floor, not the product.**
Yield does not depend on token price or protocol adoption. A participant earns Aave V3 yield regardless of whether any lock mechanism exists.

**Commitment must be verifiable, not self-reported.**
Every lock position is a timestamped, on-chain ledger entry. Tier classification and RWT issuance are computed by the contract from objective inputs — no manager approval is required.

**Exit rights are non-negotiable.**
The forced-exit mechanism was designed from day one. A commitment layer with no credible exit is a trap. Real conviction is only meaningful when voluntary.

---

## Current State

- Deployed on Base mainnet
- Capital layer: FundVaultV01 + StrategyManagerV01 + AaveV3StrategyV01
- Commitment layer: LockRewardManagerV02 + LockLedgerV02
- Access: invited whitelist (internal validation phase)
- External audit: pending

---

## Navigation

- [Architecture](./architecture.md) — how the layers are structured
- [Mainnet Contracts](./contracts.md) — deployed addresses
- [Risk & Audit Status](./risk-and-audit.md) — known risks and audit plan
- [Whitepaper](./whitepaper.md) — full technical specification
