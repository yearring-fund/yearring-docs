# Mainnet Contracts

All YearRing Fund Protocol contracts are deployed on Base mainnet.

## Network

| Item | Value |
|---|---|
| Network | Base Mainnet |
| Chain ID | 8453 |
| Block Explorer | [basescan.org](https://basescan.org) |
| Settlement Asset | USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) |

---

## Core Contracts

| Contract | Address |
|---|---|
| FundVaultV01 | [`0x9dD61ee543a9C51aBe7B26A89687C9aEeea98a54`](https://basescan.org/address/0x9dD61ee543a9C51aBe7B26A89687C9aEeea98a54) |
| StrategyManagerV01 | [`0xa44d3b9b0ECD6fFa4bD646957468c0B5Bfa64A54`](https://basescan.org/address/0xa44d3b9b0ECD6fFa4bD646957468c0B5Bfa64A54) |
| AaveV3StrategyV01 | [`0x621CC4189946128eF2d584F69bb994C84FcA612D`](https://basescan.org/address/0x621CC4189946128eF2d584F69bb994C84FcA612D) |
| RewardToken / RWT | [`0xeAb54e7cFbE5d35ea5203854B44C8516201534A9`](https://basescan.org/address/0xeAb54e7cFbE5d35ea5203854B44C8516201534A9) |
| LockRewardManagerV02 | [`0xb29DeFCF75f71bc4DaFaA353cE294C284F5e07cB`](https://basescan.org/address/0xb29DeFCF75f71bc4DaFaA353cE294C284F5e07cB) |
| LockLedgerV02 | [`0x2D95517Cc375ab2dc6433fd44A8706462A418a89`](https://basescan.org/address/0x2D95517Cc375ab2dc6433fd44A8706462A418a89) |
| GovernanceSignalV02 | [`0x9BE5636943d7BfF57ACA6047Cf945FD770CcC7d0`](https://basescan.org/address/0x9BE5636943d7BfF57ACA6047Cf945FD770CcC7d0) |
| ProtocolTimelockV02 | [`0x054Cb2c32D6062B291420584dE2e5952C372cDD6`](https://basescan.org/address/0x054Cb2c32D6062B291420584dE2e5952C372cDD6) |
| ClaimLedger | [`0x5CF9b8EC75314115EDDE5Dd332C193995Dd55234`](https://basescan.org/address/0x5CF9b8EC75314115EDDE5Dd332C193995Dd55234) |

---

## External Integrations

| Protocol | Purpose | Address |
|---|---|---|
| Aave V3 on Base | Active yield strategy | [`0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`](https://basescan.org/address/0xA238Dd80C259a72e81d7e4664a9801593F98d1c5) |
| USDC on Base | Settlement asset | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) |

---

## Operational Addresses

Non-emergency administrative operations are intended to be routed through `ProtocolTimelockV02`. Emergency operations are separated from administrative parameter changes. For security reasons, operational signer details are not expanded in this public document.

---

## Notes

- These addresses reflect the current mainnet validation deployment.
- External audit is pending. See [Risk & Audit Status](/risk-and-audit).
- Contract source code reference: [GitHub](https://github.com/yearring-fund/YearRing-FundProtocol)
