# Real-Time Poll Rooms

A full-stack real-time polling application built with Next.js (App Router) and Supabase.

## Fairness & Anti-Abuse Mechanisms
I implemented two distinct layers of defense to prevent repeat/abusive voting:

1. **IP-Based Tracking (Backend/Database Level):** A composite unique constraint `UNIQUE(poll_id, ip_address)` is enforced on the `votes` table in PostgreSQL. The Next.js API route extracts the voter's IP via the `x-forwarded-for` header. If a user attempts to vote multiple times on the same poll, the database rejects the transaction at the core level (Error 23505), preventing automated server-side abuse.
2. **Client-Side State Persistence (Frontend Level):** Upon a successful vote, the specific `poll_id` is appended to an array in the browser's `localStorage`. When the poll is revisited, the application checks this storage, instantly disables the voting buttons, and reveals the real-time results. This prevents accidental double-voting and provides immediate visual feedback.

## Edge Cases Handled
* **Invalid/Missing Route Parameters:** Navigating to `/poll/` without a valid UUID parameter normally triggers a generic 404. I implemented a route interception at `app/poll/page.tsx` that gracefully redirects incomplete URLs back to the homepage (`/`).
* **Empty/Whitespace Payloads:** The poll creation API strictly validates payloads. It trims inputs and ensures at least two valid, non-empty options are provided before attempting database insertion, preventing corrupted UI states.
* **Optimistic UI Masking:** The poll results (percentages and progress bars) are strictly hidden behind a `hasVoted` state check until the user casts their vote, preventing the current tally from influencing their decision.

## Known Limitations & Future Improvements
* **NAT/Shared Network Collisions:** Because the primary defense mechanism relies on IP tracking, multiple legitimate users sharing the same local network (e.g., a university Wi-Fi or corporate NAT) will share the same public IP. The first voter will block others on that network. A future iteration would implement lightweight browser fingerprinting or optional OAuth to safely distinguish users on the same network.
* **Incognito Mode Bypass:** The `localStorage` check can easily be bypassed by opening an Incognito window, although the IP tracking mechanism acts as a fallback to catch these attempts.
