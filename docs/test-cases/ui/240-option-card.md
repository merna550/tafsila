# Test cases — OptionCardGroup

| Field        | Value                |
| ------------ | -------------------- |
| Issue        | #240                 |
| SRS          | FR-DES-04            |
| Area         | ui                   |
| Last updated | 2026-10-24 (by #240) |

## Test data

Storybook stories "Forms/Option cards": Default, Selected, Disabled, LowConfidence, MultiSelect (RTL and LTR from the toolbar).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                      | Priority | Preconditions                               | Steps                                                                                                                                            | Expected result                                                                                                               | Automated by                             | dev | staging |
| ------------ | -------------------------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --- | ------- |
| TC-UI-240-01 | Keyboard and screen reader | High     | Storybook, Disabled and MultiSelect stories | 1. Tab into the cards, use arrows, Space and Enter (single) 2. Tab, Space and Enter (multi) 3. Turn on VoiceOver or TalkBack and focus the cards | Arrows skip the disabled card and follow RTL; Enter selects; multi toggles; the reader says the disabled reason with the card | `src/option-card.test.tsx` (markup only) | ⬜  | ⬜      |
