# Home page overrides

These rules override `MASTER.md` for the whole site, which is a single page.
The source of truth for the values is `src/styles.css`.

## Why this differs from the master file

The master file recommends a vibrant orange and green palette on slate. The owner asked for a more premium feel, so the palette was replaced. Typography (Barlow Condensed and Barlow) is unchanged.

## Palette: obsidian, ivory and one gold accent

| Role | Hex | CSS variable |
| --- | --- | --- |
| Page background | `#0a0b0d` | `--bg` |
| Surface | `#121418` | `--surface` |
| Raised surface | `#1a1d23` | `--surface-2` |
| Hover surface | `#23272f` | `--surface-3` |
| Inset | `#0d0f12` | `--inset` |
| Hairline border | `#262a32` | `--line` |
| Text | `#f3efe7` | `--fg` |
| Muted text | `#bcb6aa` | `--fg-muted` |
| Dim text | `#8d887e` | `--fg-dim` |
| Accent | `#d6b37c` | `--gold` |
| Accent highlight | `#ead2a6` | `--gold-hi` |
| Text on accent | `#17130c` | `--on-gold` |
| Positive tag | `#8fd0a6` | `--ok` |
| Warning icon | `#eba566` | `--warn` |

## Rules

- Gold is the only accent. Use it for the active state, the selected muscle and small labels. Do not add a second accent color.
- Surfaces are separated by 1px hairline borders, not by color blocks or drop shadows.
- The selected muscle on the 3D model glows in the same gold as the interface accent.
- Non-muscle parts of the model (head, hands, feet, joints) are graphite so the muscles carry the color.

## Scope

The page is the muscle explorer only: intro, 3D stage, muscle list and detail panel. The starter plan and basics sections were removed on request.
