# Campus Stores

A product-engineering work sample for a fictional campus media-equipment desk. Campus Stores helps desk staff issue equipment against approved club requests, track each physical unit while it is away, process partial returns, and hand unresolved work to the next shift without losing custody context.

> **Work-sample context:** The original candidate brief describes a Friday pickup for the Film Society followed by a partial return and a Saturday-morning handover. Open **Candidate brief** in the app to read the assignment scenario.

## Product decision

The central product decision was to treat a loan as a **physical-unit custody record**, rather than treating a multi-item request as one all-or-nothing transaction.

A club may return some equipment while another item remains with a different person. If the system closes the whole request or simply says “kit returned”, the next shift can miss an outstanding adapter or other small component. Campus Stores therefore creates one loan slip per physical asset and keeps each slip open until that unit is physically received or otherwise resolved.

The primary workflow is:

**Request → Issue individual units → Track custody → Inspect return → Reconcile exceptions → Hand over outstanding work**

The intended outcome is fewer lost items, fewer ambiguous handovers, and a clearer record of who did what.

## What changed in this work sample

The original desk structure is retained: Requests, Inventory, Loan register and Desk book. The following capabilities extend that workflow.

### 1. Physical-unit loan tracking and issue controls

- Each issued physical asset receives its own loan slip.
- Available physical units are displayed in the issue form, with submission-time validation against the selected request's approved equipment types and quantities.
- The app enforces the approved item types and quantities for that request.
- Assets marked as under repair are excluded from issue options.
- Availability is derived from outstanding loans and asset state, rather than from a staff member manually guessing whether an item is free.
- Partial returns are supported: returning one unit does not close the other slips in the same request.

**Why it matters:** this prevents an apparently complete kit from hiding a missing component and makes the state of each physical unit explicit.

### 2. Shift Handover

A dedicated **Shift handover** view surfaces unfinished work from the loan register. It includes:

- Outstanding loan slips and the linked request/asset details.
- Last recorded borrower and current reported holder/contact.
- Expected return information.
- Custody confidence, including whether a transfer is only reported or physically verified.
- Recent activity across loan slips, including activity on slips that have since closed.
- A handover acknowledgement/checklist for the incoming shift.
- A direct action to verify and record a physical return.

The assignment's Leela Das custody update is represented as a **reported holder**, not as proof that Leela physically has the adapter. The report is seeded when the sample shift advances to the Saturday scenario; it is not yet a separately entered staff report.

**Why it matters:** the incoming person should not have to reconstruct the story from scattered notes. The handover view makes unresolved work and confidence in the custody information visible in one place.

### 3. Return-condition inspection

When staff choose **Record return** / **Verify & record return**, the app asks for the physical condition:

| Inspection result | Loan behaviour | Inventory behaviour |
|---|---|---|
| **Good** | Closes the loan as physically returned | Asset can become available again |
| **Damaged** | Closes the loan and records condition/details | Asset is marked **In repair** and cannot be issued |
| **Missing** | Records an exception; loan stays open | Asset remains outstanding/unavailable because it was not physically received |

The signed-in demo user is recorded as the inspection actor. Damage notes and exception details are included in the audit export.

**Why it matters:** “returned” must mean the item was actually received. A missing item is not a return, and a damaged item should not silently re-enter circulation.

### 4. Activity history and supervisor CSV export

The app records events such as issue, custody update, physical return and return exception. The Shift Handover view exposes recent activity, including events for closed loans.

Supervisors can export a CSV audit report locally from the browser. It includes loan/request/asset identifiers, borrower, due text, open/returned state, reported custody holder, custody verification, activity, actor, event time, details and verification state.

CSV fields are quoted and embedded quotes are escaped. The export is generated in the browser; the data is not sent to an external service.

**Why it matters:** a supervisor can review the sequence of events, share an operational snapshot and investigate a discrepancy without manually copying information from multiple screens.

> The CSV is an operational report, **not a tamper-proof audit log**. Browser-local records can still be edited or cleared.

### 5. Demo sign-in and role-based UI permissions

A sign-in gate demonstrates three roles:

| Role | Demo permissions |
|---|---|
| Desk staff | Issue/return equipment, add desk notes, advance the sample scenario and acknowledge handover |
| Supervisor | Desk staff actions plus supervisor actions such as restarting the sample and exporting the audit report |
| Read-only viewer | Browse records without changing them |

Users can sign out and return to the sign-in gate.

**Why it matters:** even a prototype can demonstrate how different desk responsibilities should shape the interface and available actions.

**Security limitation:** this is a front-end demonstration only. It does not verify passwords, establish a trusted identity, or provide a security boundary. A user who can inspect or modify browser JavaScript/local storage can bypass it. Do not use it for real campus operations or real personal data.

## Assignment scenario walkthrough

The intended sample story is:

1. **Friday, 3:45 pm — Pickup:** Kabir Sen collects the HDMI projector, portable speaker and USB-C-to-HDMI adapter for Film Society request RQ-214. The three physical units are represented by separate loan slips.
2. **Friday, 7:30 pm — Partial return:** the projector and speaker are physically returned. Their slips close; the adapter slip stays open.
3. **Friday handover note:** Kabir reports that Leela Das has the adapter and expects her to bring it back at 9:00 am Saturday. This is a reported custody update, not a verified physical handoff.
4. **Saturday, 9:00 am — Incoming shift:** staff can see the adapter as the outstanding unit, check the reported holder and expected return, then record the physical return against the correct loan.

The sample also contains other club loans so the desk can be explored beyond the primary Film Society story.

## Running locally

The project is a static front-end prototype and does not require a build step or API key.

### Option 1: Open directly

Open `index.html` in a modern browser.

### Option 2: Serve over local HTTP (recommended for testing)

From the repository folder, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit [http://localhost:8000](http://localhost:8000).

You can also use the VS Code **Live Server** extension to serve `index.html` locally.

### Local sample data

Each browser stores its own sample shift in browser storage when available. **Restart sample shift** restores the fictional starting records. Different browsers or browser profiles do not share data.

## Project structure

- `index.html` — desk layout, candidate brief and bundled icons (kept from the original repository).
- `app.js` — sample records, workflow logic, role demonstrations, persistence, handover, inspection and CSV export.
- `styles.css` — application layout and responsive styling.
- `third-party/lucide-LICENSE.txt` — icon license notice.

## Product thinking and trade-offs

The changes focus on the points where equipment-desk work can become ambiguous or operationally risky:

- **Track units, not just requests.** A request can be partially fulfilled or partially returned.
- **Separate reported custody from verified receipt.** A message saying someone has an item is useful context, but it is not proof that the desk received it.
- **Make exceptions explicit.** Damaged and missing are not interchangeable with a normal return.
- **Keep repair items unavailable.** A damaged item should not be offered for another issue.
- **Carry context across shifts.** The next shift needs an actionable list, not only a free-text note.
- **Keep an activity trail.** Important changes should be attributable to the demo user and visible after a loan closes.
- **Avoid false security claims.** The login is a permission/UI demonstration, not production authentication.

### Success measures to validate with real usage

A useful north-star measure for a future operational deployment would be:

**Percentage of equipment loans reconciled correctly by their expected return time.**

Supporting measures could include:

- Outstanding units past their expected return time.
- Percentage of returns with a recorded condition.
- Missing/damaged exceptions per 100 issued units.
- Handover completion rate and unresolved items acknowledged by the incoming shift.
- Time taken by incoming staff to identify the correct outstanding loan.
- Number of inventory issues caused by assets incorrectly shown as available.

These are proposed measures, not results from a live deployment. The current sample does not collect real operational analytics.

## Ideas considered but not included

The following ideas were considered as possible extensions. They are intentionally not represented as implemented features.

| Idea | Potential value | Why it is deferred |
|---|---|---|
| Real authentication through Supabase Auth, Firebase Authentication or organisation SSO | Verified staff identity and centrally managed access | Requires an identity provider, backend/session design and server-side authorization. The current role selector is only a demo. |
| Server-side authorization and shared database | Reliable permissions and a shared source of truth across desks/devices | Requires backend APIs, data model, deployment and access-control rules. |
| Multi-user live synchronisation | Prevents two desks from acting on stale local state | Depends on a shared backend, conflict handling and real-time update strategy. |
| Tamper-resistant audit history | Stronger accountability and investigation trail | Cannot be achieved with local storage or a downloadable CSV. Requires server-side append-only/event storage, access controls and retention policy. |
| QR/barcode scanning | Faster and more reliable identification of physical units | Requires a scanning interface, labels and device/browser testing. Asset IDs already provide a foundation. |
| Reservations and availability calendar | Helps clubs plan ahead and reduces counter-time conflicts | Requires reservation rules, conflict resolution and time-aware inventory allocation. |
| Kit templates / reusable bundles | Faster issue of common combinations such as a screening kit | Useful after request-to-asset matching and quantity rules are stable; not necessary to solve the partial-return handover scenario. |
| Due-date reminders and overdue queue | Helps staff follow up before and after expected return | Current sample due values are display-oriented text. A robust reminder system needs structured timestamps, timezone rules and a notification channel. |
| More detailed inspection taxonomy (photos, severity, repair notes, missing components) | Better maintenance triage and evidence | Adds operational complexity and likely needs file storage and a repair workflow. The prototype uses Good/Damaged/Missing as a deliberately small first pass. |
| Analytics dashboard | Shows utilization, turnaround and exception trends | Meaningful analytics require reliable event data over time; the sample data is fictional and too small for conclusions. |
| Automated notifications to borrowers/holders | Reduces manual follow-up | Requires verified contact details, consent, delivery provider and notification policy. |

These are possible roadmap directions, not commitments. They should be prioritised only after observing actual desk workflows and validating the underlying problem.

## Technical limitations

- This is a browser-only prototype with local storage; it has no backend or shared database.
- Data is local to the browser/profile and can be cleared or modified by the user.
- Demo identities and roles are not authenticated and do not provide production security.
- The custody update for Leela Das is seeded from the assignment scenario when the sample advances; it is not entered through an independent custody-report form.
- The audit CSV is useful for review but is not tamper-proof.
- No external API key or third-party authentication integration is configured.
- The sample uses fictional people, clubs and equipment records.

## Testing and verification

A browser-based test harness was used during development to check the core workflow and persistence logic. The checks included:

- Rendering the five navigation sections.
- Issuing the three approved Film Society assets as separate physical-unit slips.
- Excluding equipment marked as under repair.
- Rejecting item types not included in the selected request and enforcing approved quantities.
- Returning the projector and speaker while leaving only the adapter outstanding.
- Recording Leela Das as a reported holder rather than a physically verified holder.
- Returning the adapter against the correct open slip.
- Retaining activity history after a loan closes.
- Preserving sample state across a simulated reload and migrating older v1/v2 local-storage data to the current format.
- Checking the tested flows for JavaScript runtime errors.

The updated app was also opened manually in a browser during the work sample. The login gate, role display, navigation, handover, loan register and desk book rendered. A damaged-return action was manually exercised and the UI reported the loan closed and the asset marked unavailable for repair.

**Verification caveat:** the automated harness used the app's expected DOM hooks rather than the complete original `index.html`. The browser test harness therefore does not replace a full end-to-end regression test against the exact submitted repository. Good and Missing return outcomes, CSV download, and the full assignment path should be rechecked in the target browser before treating them as fully verified.
