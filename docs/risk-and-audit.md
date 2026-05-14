# Risk & Audit Status

> YearRing Fund Protocol is experimental software deployed on Base Mainnet. Users should independently assess all risks before interacting.

---

## Current Status

| Item | Status |
|---|---|
| External audit | Pending — in preparation |
| Access | Invited allowlist — internal validation phase |
| Governance | Controlled admin roles during beta · Multisig / Timelock planned before broader public access |
| Bug bounty | Not yet active |

---

## Risk Categories

### Smart Contract Risk

The V2.1 contracts have not yet completed a third-party external audit. Although the protocol has been reviewed internally and tested against a Base mainnet Aave V3 fork, undiscovered bugs may exist in:

- ERC-4626 share accounting and redemption logic (`YearRingCoreVaultV21`)
- Strategy integration and aToken accounting (`AaveUSDCStrategyV21`)
- Lock position management and Points accrual (`LockManagerV21`, `PointsLedgerV01`)
- Management fee rebate calculation (`RebateManagerV21`)

### Strategy Risk

The current active strategy is Aave V3 USDC supply on Base. Risks include:

- Aave V3 smart contract risk (aToken, pool, oracle)
- USDC depegging or Circle issuer risk
- Aave protocol parameter changes (borrow rate, reserve factor, supply caps)
- On-chain reserve band enforcement (MIN 5% / TARGET 10% / MAX 15%) reduces but does not eliminate liquidity risk during large redemption events

### Admin and Governance Risk

During V2.1 beta, all admin, keeper, and emergency roles are held by a monitored operator address. This is a deliberate tradeoff: it allows rapid response during the validation phase but concentrates control. Planned hardening steps (Timelock + multisig) are not yet deployed.

The operator can:
- Activate Paused mode (systemMode=1) — blocks deposits, redemptions remain open
- Activate Emergency Mode (systemMode=2) — blocks both deposits and withdrawals while risk is reviewed
- Adjust allowlist, strategy parameters, and fee configuration

The operator **cannot** use emergency controls to redirect or seize user principal. Emergency controls do not add a direct operator withdrawal path.

### Liquidity Risk

The on-chain reserve band (MIN 5% / TARGET 10% / MAX 15% of vault assets held in idle USDC) provides a buffer for normal-sized redemptions. Very large or simultaneous redemptions may require capital to be pulled from the Aave strategy before settlement. In normal operation, auto-rebalance handles this on every deposit and withdrawal.

### Points Risk

Internal Points (`PointsLedgerV01`) are non-transferable and have no guaranteed market value. They are a commitment-layer accounting mechanism, not an asset. Points balances represent cumulative lock activity and are subject to the terms of the protocol.

---

## Responsible Disclosure

If you discover a potential vulnerability, contact:

**security@yearringfund.com**

Please do not publicly disclose vulnerabilities before the team has had a reasonable opportunity to investigate and respond.

---

## Security Review Scope (V2.1 Beta)

Current review focus includes:

- `YearRingCoreVaultV21`
- `CoreStrategyManagerV21`
- `AccessStrategyManagerV21`
- `AaveUSDCStrategyV21`
- `LockManagerV21`
- `PointsLedgerV01`
- `RebateManagerV21`
- `TreasuryV21`
- `PortfolioLensV21`
- `EligibilityModuleV21`

[← Back to Overview](/)
