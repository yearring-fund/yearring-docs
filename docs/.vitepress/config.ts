import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'YearRing Fund Protocol',
  description: 'On-chain fund and long-term capital coordination protocol on Base.',

  head: [
    ['meta', { name: 'og:title', content: 'YearRing Fund Protocol Docs' }],
    ['meta', { name: 'og:description', content: 'Protocol documentation for YearRing Fund — on-chain fund infrastructure on Base.' }],
  ],

  themeConfig: {
    logo: undefined,
    siteTitle: 'YearRing Docs',

    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Contracts', link: '/contracts' },
      { text: 'Risk & Audit', link: '/risk-and-audit' },
      { text: 'Whitepaper', link: '/whitepaper' },
      { text: 'App', link: 'https://app.yearringfund.com', target: '_blank' },
    ],

    sidebar: [
      {
        text: 'Protocol',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Whitepaper', link: '/whitepaper' },
        ],
      },
      {
        text: 'Deployment',
        items: [
          { text: 'Mainnet Contracts', link: '/contracts' },
        ],
      },
      {
        text: 'Risk & Compliance',
        items: [
          { text: 'Risk & Audit Status', link: '/risk-and-audit' },
          { text: 'Security', link: '/security' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yearring-fund/YearRing-FundProtocol' },
    ],

    footer: {
      message: 'YearRing Fund Protocol is experimental software. Nothing here constitutes financial advice.',
      copyright: 'YearRing Fund Protocol — Built on Base',
    },

    editLink: undefined,
  },
})
