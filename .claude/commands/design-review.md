# Design Review Command

Run a comprehensive design review on the GymProLuxe application.

## Usage
```
/design-review [target]
```

**Targets:**
- `pwa` — Review the PWA at http://localhost:3000
- `admin` — Review the Admin Panel at http://localhost:3001
- `both` — Review both apps
- A specific URL path, e.g., `/login` or `/workouts`

## Prerequisites
- Dev server must be running (`npm run dev`)

## What It Does

Use the Task tool to invoke the `design-review-agent` with the following prompt:

> Perform a full design review of the GymProLuxe application.
>
> **Target:** $ARGUMENTS (default: pwa)
>
> Follow the 7-phase review process defined in your agent configuration.
> Take screenshots at every significant step.
> Generate the final markdown report and save it to `docs/reviews/YYYY-MM-DD-design-review.md`.
>
> Reference the design principles in `/context/design-principles.md` for the quality bar.

The review agent will:
1. Navigate through all accessible pages
2. Test at 3 viewport sizes (mobile, tablet, desktop)
3. Check accessibility, visual consistency, and interactive states
4. Generate a detailed report with screenshots and findings
