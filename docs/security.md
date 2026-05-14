# Security

## Audit Status

YearRing Fund Protocol V2.1 Beta has not yet completed a third-party external audit. An external audit is in preparation.

| Item | Status |
|---|---|
| External audit | Pending — in preparation |
| Mainnet validation | In progress (invited allowlist) |
| Internal review | Ongoing |
| Public bug bounty | Not yet active |

## Responsible Disclosure

If you discover a potential vulnerability, please contact:

**security@yearringfund.com**

Please do not publicly disclose vulnerabilities before the team has had a reasonable opportunity to investigate and respond.

## Scope

Current security review focus (V2.1 Beta contracts):

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

## Known Limitations

The protocol is in a controlled beta validation phase. Users and reviewers should assume:

- Smart contract risk exists — external audit is still pending
- Strategy integration risk exists (Aave V3 USDC supply on Base)
- Admin role concentration risk exists during beta (Timelock + multisig planned but not deployed)
- Liquidity risk may exist during large or simultaneous redemption events

## Contact

| | |
|---|---|
| Website | https://yearringfund.com |
| App | https://app.yearringfund.com |
| Docs | https://docs.yearringfund.com |
| Security | security@yearringfund.com |
