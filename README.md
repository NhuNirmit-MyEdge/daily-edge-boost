# My Daily Edge

Build a mobile-first Progressive Web App called "MyEdge" — a personal daily intelligence and growth dashboard.

Connect it to my existing Supabase project (already linked), which has these tables: daily_entries (entry_date, news_brief jsonb, expert_insight jsonb, lesson jsonb, task text, quiz jsonb, market_note jsonb), quiz_responses (entry_date, question_index, selected_index, correct), task_completions (entry_date, completed, completed_at, note), and profile (id, topics_covered, streak_count, last_completed_date).

Build one main "Today" screen that fetches the daily_entries row where entry_date = today, and shows, in this order: a "Good morning" header with today's date; a News section rendering each item in news_brief as a card showing headline, what happened, why it matters, why it matters to me, and what to watch next; an Expert Insight card showing title, source, key idea, and application; a Today's Lesson card showing module/day, title, and content, with a text box underneath prompting "Explain this in your own words" that just saves the free-text answer; a Today's Action card showing the task text and a "Mark complete" button that writes to task_completions; and a Quiz section showing the 5 questions one at a time with 4 selectable options, showing correct/incorrect immediately with the explanation, saving each answer to quiz_responses, and a final score out of 5 plus the streak from profile.streak_count.

If no row exists for today's date yet, show a friendly "Today's edge is still being prepared — check back soon" empty state instead of erroring.

Make this installable as a Progressive Web App: add a web app manifest (name "MyEdge", a simple icon, standalone display mode) and a service worker so it can be added to a phone's home screen. Clean, minimal, mobile-first, single column.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://daily-edge-boost.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49c80ec9-6eb8-4777-bcaf-144210b0ad5d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
