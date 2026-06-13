# Cluely.com — Page Topology

Target: https://cluely.com

## Section Order (top → bottom)

| # | Section | Interaction model |
|---|---------|-------------------|
| 0 | Header (absolute overlay) | scroll-driven floating CTA |
| 1 | Hero | time-driven animations, video loop |
| 2 | Section divider | scroll-driven scaleX |
| 3 | How Cluely helps | static mockups + simulated waveform |
| 4 | Section divider | scroll-driven |
| 5 | Instant meeting notes | scroll-driven fade-up |
| 6 | Section divider | scroll-driven |
| 7 | Undetectable (#undetectability) | scroll snap mobile, compare slider |
| 8 | Section divider | scroll-driven |
| 9 | Real-time transcription | scroll-driven fade-up |
| 10 | Section divider | scroll-driven |
| 11 | FAQ | click-driven accordion |
| 12 | Bottom CTA | time-driven key toggle |
| 13 | Gradient fade | static |
| 14 | Footer | static links |

## Layout

- Main: `flex flex-col gap-12 md:gap-24 lg:gap-32`
- Content max-width: `max-w-7xl` (header `max-w-6xl`)
- Horizontal padding: `px-5 md:px-8`
- Theme background footer: `#DDE2EE`
