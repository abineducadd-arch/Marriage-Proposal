<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Story chapters use separate TanStack leaf routes and reusable scene components under `src/components/story`; this preserves the original welcome scene and isolates later chapters.
- Page 2 discovery rules and configurable switch/next-chapter settings live in a browser-safe module with focused tests; this keeps unlock behavior stable and testable.
- Page 2 flashlight position is written directly to surface CSS variables, with React updates only for discovery changes; this avoids rerendering the scene on every pointer move.
- Page 3 keeps its scene state in a dedicated page component and its editable proposal/video settings in a browser-safe story module; this keeps the narrative self-contained and easy to personalize.
