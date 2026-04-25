# Risk & Audit Status

## Audit Status

**Audit Status: Pending formal third-party audit.**

**Current Status: Internal testing and mainnet limited validation.**

| Item | Status |
|---|---|
| Internal review | Ongoing |
| Test suite (613 cases) | Passing |
| Mainnet validation | In progress (invited whitelist only) |
| External third-party audit | Pending |
| Public bug bounty | Not yet active |

A formal external audit is planned before broader public user expansion. Until then, the protocol operates in a controlled access mode with invited participants only.

---

## Known Risks

### Smart Contract Risk

The protocol contracts have not been formally audited by a third party. The test suite covers 613 cases across vault accounting, access control, emergency paths, and commitment operations. Testing does not eliminate all contract risk.

### Strategy Risk

Vault capital deployed to Aave V3 is subject to Aave protocol risk — including smart contract vulnerabilities, governance actions, and market conditions. If Aave's aUSDC value decreases, vault PPS decreases proportionally.

### Operational Risk

Admin operations (strategy deployment, fee changes, mode transitions) pass through a 24-hour timelock. The emergency role can pause immediately but cannot reconfigure the system. In the current version, admin control is concentrated — full multisig governance is planned but not yet implemented.

### Liquidity Risk

Redemptions require sufficient idle USDC in the vault. If idle balance is insufficient, users must wait for a rebalance or admin divest action before redeeming.

### Fee Rebate Source Risk

Rebates are paid from the treasury's fbUSDC balance. If treasury shares are depleted, rebate claims and early exit settlements will revert until replenished.

### RWT Price Risk

RWT has no guaranteed market value. Its price is determined by secondary market activity, if any. The protocol does not provide liquidity guarantees for RWT.

---

## Security Contact

To report a vulnerability: **security@yearringfund.com**

See [Security Policy](./security.md) for full responsible disclosure guidelines.
