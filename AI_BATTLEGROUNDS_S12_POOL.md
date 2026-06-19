# Battlegrounds S12 Season-End Pool Verification

This document is the current verification baseline for the Battlegrounds MVP work in this repo.

## Scope

- This file focuses on the first implementation wave only: regular recruit-pool minions for Pirates, Elementals, and directly relevant hybrid minions.
- It is not yet the exhaustive all-tribe S12 global pool.
- Timewarped Tavern cards are recorded as a separate future stage and are not part of the first playable recruit pool.
- Where possible, values below are reconstructed only from official Blizzard patch notes up to the end of Season 12.

## Official Season Boundary

- Battlegrounds Season 12 started on December 2, 2025 in Patch 34.2.
- Battlegrounds Season 12 ended and Season 13 began on April 14, 2026 in Patch 35.2.
- For this project, "S12 season-end" means the state after Patch 35.0.3 on April 2, 2026 and before Patch 35.2 on April 14, 2026.

Official sources:

- [34.2 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24244423)
- [34.2.2 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24250382)
- [34.4.2 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24244400/34-4-2-patch-notes)
- [34.6 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24242740/34-6-patch-notes)
- [34.6.2 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24242744)
- [35.0.3 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24271854/35-0-3-patch-notes)
- [35.2 Patch Notes](https://hearthstone.blizzard.com/en-us/news/24271853/35-2-patch-notes)

## Official Change Chain Relevant To First-Wave Tribes

| Date | Patch | Official signal | Impact on first-wave implementation |
| --- | --- | --- | --- |
| 2025-12-01 | 34.2 | Season 12 announced, live on 2025-12-02 | Establishes S12 start point |
| 2025-12-01 | 34.2 | Removed from regular pool: `Molten Rock`, `Elemental of Surprise`, `Southsea Busker`, `Thieving Rascal` | These are not in the S12 opening regular pool |
| 2025-12-01 | 34.2 | New regular Elementals: `Waveling`, `En-Djinn Blazer`, `Air Revenant`, `Acid Rainfall` | These are S12-native regular pool cards |
| 2025-12-01 | 34.2 | New regular Pirates: `Minted Corsair`, `Industrious Deckhand`, `Visionary Shipman`, `Cannon Corsair` | These are S12-native regular pool cards |
| 2025-12-01 | 34.2 | Returning relevant cards: `Felemental`, `Underhanded Dealer`, `Briny Bootlegger`, `Fleet Admiral Tethys` | These re-enter the regular pool in S12 |
| 2025-12-12 | 34.2.2 | `Yorik Smite` removed from pool | Pirate pool changes again during S12 |
| 2025-12-12 | 34.2.2 | `En-Djinn Blazer`, `Acid Rainfall`, `Underhanded Dealer`, `Cannon Corsair` updated | Use post-34.2.2 values, not 34.2 launch values |
| 2026-01-27 | 34.4.2 | `Acid Rainfall`, `Peggy Sturdybone`, `Underhanded Dealer` updated | Use post-34.4.2 values |
| 2026-02-09 | 34.6 | `Unleashed Mana Surge` returns with changes; `Shore Marauder` appears; `Fleet Admiral Tethys` updated | Adds late-season Elemental/Pirate pieces |
| 2026-02-24 | 34.6.2 | `Thieving Rascal` returns; `Groundbreaker` removed | Pirate gains back `Thieving Rascal`; do not include `Groundbreaker` at season end |
| 2026-04-02 | 35.0.3 | Final major balance patch of S12; `Nomi, Kitchen Nightmare`, `Underhanded Dealer`, `Stellar Freebooter` updated | This is the final balance state before S13 |
| 2026-04-14 | 35.2 | S12 ends, S13 begins | Season-end cutoff |

## Recommended First-Wave Regular Pool

This is the recommended first implementation subset for the MVP recruit pool.

### Pirates

| Tier | Card | Season-end value used for implementation | Source |
| --- | --- | --- | --- |
| 1 | `Minted Corsair` | `1/3`. "When you sell this, get a Tavern Coin." | 34.2 |
| 3 | `Peggy Sturdybone` | `2/1`. "Whenever a card is added to your hand, give another friendly Pirate +2/+1." | 34.4.2 |
| 3 | `Stellar Freebooter` | `7/3`. `Taunt`. "Deathrattle: Give another friendly Pirate Health equal to this minion's Attack." | 35.0.3 |
| 4 | `Gunpowder Courier` | `2/6`. "Whenever you spend 6 Gold, give your Pirates +2 Attack. (6 Gold left!)" | 34.6 |
| 4 | `Underhanded Dealer` | `[Tier 4] 6/6`. "After you gain Gold, gain +2/+2." | 35.0.3 |
| 5 | `Visionary Shipman` | `5/5`. "After you gain Gold 5 times, get a random Tavern spell. (5 left!)" | 34.2 |
| 5 | `Cannon Corsair` | `[Tier 5] 3/7`. "After you gain Gold, give your other Pirates +1/+1." | 34.2.2 |
| 6 | `Fleet Admiral Tethys` | `[Tier 6] 5/6`. "After you spend 10 Gold, get a random Pirate. (10 left!)" | 34.6 |

### Elementals

| Tier | Card | Season-end value used for implementation | Source |
| --- | --- | --- | --- |
| 3 | `Waveling` | `6/1`. "Deathrattle: After the Tavern is Refreshed this game, give its right-most minion +3/+3." | 34.2 |
| 4 | `En-Djinn Blazer` | `4/4`. "Battlecry: After the Tavern is Refreshed this game, give its right-most minion +7/+7." | 34.2.2 |
| 5 | `Unleashed Mana Surge` | `[Tier 5] 5/4`. "After you play an Elemental, give your Elementals +2/+2." | 34.6.2 |
| 5 | `Nomi, Kitchen Nightmare` | `[Tier 5] 6/6`. "After you play an Elemental, give Elementals in the Tavern +3/+3 this game." | 35.0.3 plus older official tier source |
| 5 | `Air Revenant` | `3/6`. "After you spend 7 Gold, get Easterly Winds. (7 left!)" | 34.2 |
| 6 | `Acid Rainfall` | `8/8`. "After you Refresh 5 times, gain the stats of the right-most minion in the Tavern. (5 left!)" | 34.4.2 |

### Hybrid Minions

| Tier | Card | Season-end value used for implementation | Source |
| --- | --- | --- | --- |
| 4 | `Flaming Enforcer` | `[Tier 4] 4/5`. "At the end of your turn, consume the highest-Health minion in the Tavern to gain its stats." | 34.2 |
| 6 | `Shore Marauder` | `[Tier 6] 4/5`. "Your Pirates and Elementals give an extra +1/+1." | 34.6 |

## Confirmed Exclusions For This First-Wave Regular Pool

These cards are explicitly out of the season-end regular pool or intentionally omitted from the first implementation subset:

- `Southsea Busker` was removed from the regular pool in 34.2.
- `Molten Rock` was removed from the regular pool in 34.2.
- `Elemental of Surprise` was removed from the regular pool in 34.2.
- `Yorik Smite` was removed from the pool in 34.2.2.
- `Groundbreaker` was removed in 34.6.2, so it should not appear in S12 season-end regular pool.
- Timewarped-only minions are not included in the first recruit-pool implementation.

## Timewarped Tavern Handling

Not part of the first implementation pool, but still important for later S12 authenticity:

- `Timewarped Busker`
- `Timewarped Sailor`
- `Timewarped Pagle`
- `Timewarped Cyclone`
- `Timewarped Sellemental`
- `Timewarped Ragnaros`
- `Timewarped Snow Elemental`
- `Timewarped Upstart`
- `Timewarped Molten Rock`
- `Timewarped Substrate`
- `Timewarped Ichoron`
- `Timewarped Stormcloud`
- `Timewarped Behemoth`

## Verification Notes

- This file is intentionally conservative: if a card could not be pinned to S12 season-end through Blizzard patch notes, it was not promoted into the recommended first-wave pool.
- The current UI shell in this repo should use this file as the visual/data baseline for the first recruit and combat panels.
- After user verification, the next expansion of this file should be:
  1. full all-tribe regular pool,
  2. tavern spell pool by tier,
  3. golden triple reward mapping,
  4. Timewarped Tavern card list and Chronum rules.
