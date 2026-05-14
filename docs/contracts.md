# Mainnet Contracts — V2.1 Beta

All contracts are deployed on **Base Mainnet** (Chain ID: 8453).

---

## Capital Layer

| Contract | Address |
|---|---|
| YearRingCoreVaultV21 (yrUSDC) | [`0x53e45AcB32aCD80F3d215a007fD8FE87390746F8`](https://basescan.org/address/0x53e45AcB32aCD80F3d215a007fD8FE87390746F8) |
| CoreStrategyManagerV21 | [`0xc615c0c37524e9997622337cC973aC24C40e0548`](https://basescan.org/address/0xc615c0c37524e9997622337cC973aC24C40e0548) |
| AccessStrategyManagerV21 | [`0x49f2FF1CF3BcD216f4958485407a038535f1Ebb0`](https://basescan.org/address/0x49f2FF1CF3BcD216f4958485407a038535f1Ebb0) |
| AaveUSDCStrategyV21 (CoreSM) | [`0x58F265139E3693651B4E30961a1e535b413BBa2C`](https://basescan.org/address/0x58F265139E3693651B4E30961a1e535b413BBa2C) |
| AaveUSDCStrategyV21 (ASM) | [`0xc61D5966F2802aff6c6377C21bBdE923Daf879e0`](https://basescan.org/address/0xc61D5966F2802aff6c6377C21bBdE923Daf879e0) |
| TreasuryV21 | [`0x413f038278A97FC2AE413380Ba0ef195F4e8a0b2`](https://basescan.org/address/0x413f038278A97FC2AE413380Ba0ef195F4e8a0b2) |

## Commitment Layer

| Contract | Address |
|---|---|
| LockManagerV21 | [`0xCDc679865b5161C7b7cf75584551F5B57828d59F`](https://basescan.org/address/0xCDc679865b5161C7b7cf75584551F5B57828d59F) |
| PointsLedgerV01 | [`0xb9c51ff318352c21f2fF5D378D31eFE0c7020dFe`](https://basescan.org/address/0xb9c51ff318352c21f2fF5D378D31eFE0c7020dFe) |
| RebateManagerV21 | [`0x3B1F6956D5212bCA3Af223DD63AE31420233aDAD`](https://basescan.org/address/0x3B1F6956D5212bCA3Af223DD63AE31420233aDAD) |

## Read / Aggregation Layer

| Contract | Address |
|---|---|
| PortfolioLensV21 | [`0xeb6C6b8FaE3c10271ea94dc5C071FE8147E01a0a`](https://basescan.org/address/0xeb6C6b8FaE3c10271ea94dc5C071FE8147E01a0a) |
| EligibilityModuleV21 | [`0x7ee0ED49A008e6feA8d196492699a87f878a2022`](https://basescan.org/address/0x7ee0ED49A008e6feA8d196492699a87f878a2022) |

---

## Key Token

| Token | Address | Notes |
|---|---|---|
| USDC (Base) | [`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) | Underlying asset |
| yrUSDC | Same as YearRingCoreVaultV21 | ERC-4626 share token |

---

## Notes

- **yrUSDC** is the ERC-4626 share token minted by `YearRingCoreVaultV21`. Price Per Share is derived from `convertToAssets(1e18)` — not set by admin.
- **PointsLedgerV01** records non-transferable internal Points. Points are not ERC-20 tokens and have no guaranteed market value.
- **AccessStrategyManagerV21** is the entry point for lock-eligible users; `CoreStrategyManagerV21` handles general capital deployment.
- Two `AaveUSDCStrategyV21` instances exist: one connected to CoreStrategyManagerV21 and one to AccessStrategyManagerV21.

---

## Deprecated (V01 / V02)

The following contracts are deprecated. They remain on-chain but are no longer actively used.

| Contract | Address | Status |
|---|---|---|
| FundVaultV01 | [`0x9dD61ee543a9C51aBe7B26A89687C9aEeea98a54`](https://basescan.org/address/0x9dD61ee543a9C51aBe7B26A89687C9aEeea98a54) | Deprecated |
| StrategyManagerV01 | [`0xa44d3b9b0ECD6fFa4bD646957468c0B5Bfa64A54`](https://basescan.org/address/0xa44d3b9b0ECD6fFa4bD646957468c0B5Bfa64A54) | Deprecated |
| AaveV3StrategyV01 | [`0x621CC4189946128eF2d584F69bb994C84FcA612D`](https://basescan.org/address/0x621CC4189946128eF2d584F69bb994C84FcA612D) | Deprecated |
| LockRewardManagerV02 | [`0x129aEce0C7659575Ae7aB4e78bfe4ca8946B962a`](https://basescan.org/address/0x129aEce0C7659575Ae7aB4e78bfe4ca8946B962a) | Deprecated |
| LockLedgerV02 | [`0x2FC1d315c67AE3Df2a062f7130d58FaA6c0ce9EF`](https://basescan.org/address/0x2FC1d315c67AE3Df2a062f7130d58FaA6c0ce9EF) | Deprecated |
| ProtocolTimelockV02 | [`0x054Cb2c32D6062B291420584dE2e5952C372cDD6`](https://basescan.org/address/0x054Cb2c32D6062B291420584dE2e5952C372cDD6) | Deprecated |

[← Back to Overview](/)
