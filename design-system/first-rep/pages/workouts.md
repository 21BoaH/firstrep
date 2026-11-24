# Workouts page overrides

Rules for `workouts.html`, the workout builder and log. Palette and type are the site's: see
`home.md` (obsidian, ivory and one gold accent; Barlow Condensed and Barlow). The orange and green
palette and the landing-page pattern in `MASTER.md` do not apply here: this is a tool people use
mid-workout, not a showcase.

Source of truth for the values: `src/workouts.css` and `src/styles.css`.

## Structure

Four sections, one at a time, each with its own address so links and the Back button work:

| Section | Address | Holds |
| --- | --- | --- |
| Workouts | `#/` | the workout in progress, the saved workouts, building one (`#/workout/<id>`), logging one (`#/session`) |
| History | `#/history` | every logged session by month, one session (`#/log/<id>`) |
| Exercises | `#/exercises` | the library with search and filters, one exercise (`#/exercise/<id>`) |
| Progress | `#/progress` | the last 7 days, sets per week, muscles this week, personal bests |

- Navigation adapts to the screen: a sidebar from 1024px, a bottom bar below it. Same four items,
  icon and label, current one in gold. Never both at once. On a short screen (a phone on its side)
  the bottom bar is one row, icon beside label.
- Settings (weight unit, body figure, backup, restore) are secondary: a Settings dialog in the page
  header, not mixed into the sections.
- Modals are for sub-tasks only: adding exercises to a workout, confirming, settings. The exercise
  library is a section, not a modal.

## Layout

- Desktop: section nav, main column, and a context rail. The rail shows the body map for what the
  main column shows (this week, this workout, worked so far, this session), or the exercise detail
  in the Exercises section. Progress spans the full width and has no rail.
- Phone: main column first. The rail follows only where it adds to the task (building, logging,
  a logged session). The bottom bar reserves space so it never covers content.
- Compact page header. The tool, not a headline, is above the fold.

## Components

- One primary action per view, in gold. Destructive actions are text buttons in the danger colour,
  set apart at the end of the row.
- Cards for workouts, rows for history and exercises, tiles for numbers. One style of each.
- Touch targets 44px or more, with at least 8px between them.
- While logging, a sticky bar keeps the clock, the sets done and Finish in view.
- Removing an exercise or deleting a workout or session shows a toast with Undo instead of a
  confirm. Discarding a workout in progress and restoring a backup still confirm first.
- Toasts announce politely and never take focus.
- Muscle set counts are shown as whole numbers. Secondary muscles count half, and the legend says so.
- Time windows have one name each: "Last 7 days" (or "in 7 days") is rolling, used by the tiles,
  the body map and the header count. "This week" is only the calendar week since Monday, in the
  sets-per-week chart.
- Charts: one bar per week with its value on the bar, drawn in HTML so the labels keep their size on
  a phone, a visible one-line summary, and a table for screen readers.
- Fields reached with the keyboard are never hidden under the sticky bars (scroll padding).
