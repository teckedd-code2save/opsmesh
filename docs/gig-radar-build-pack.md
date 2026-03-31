# Gig Radar Build Pack

## Product thesis
Gig Radar is an agent-native opportunity radar that uses OpenClaw-powered intelligence to monitor selected gig/job sources, normalize listings, score them for fit/pay/effort, send ranked alerts, and draft tailored proposals while keeping a human approval loop for external actions.

## Product boundaries
### It does
- watch configured sources on schedule
- store and deduplicate opportunities
- analyze opportunities with OpenClaw
- send Telegram alerts for promising listings
- provide a review queue and proposal drafts

### It does not initially
- blindly auto-apply everywhere
- bypass site restrictions
- impersonate human labor
- fully automate risky external actions

## OpenClaw integration boundary
### OpenClaw handles
- reasoning and scoring
- proposal draft generation
- Telegram notifications
- browser/web fetch as needed
- scheduled analysis work

### OpsMesh handles
- persistent database
- source definitions
- polling/fetch logs
- review state
- dashboard/UI
- approval and action history

## MVP surfaces
1. Radar Inbox
2. Opportunity Detail
3. Preferences
4. Source Management
5. Telegram Alerts

## First 3 source types
1. RSS connector
2. Simple HTML list parser
3. One board-specific parser

## Done for first usable version
- add 3 sources
- poll them on schedule
- store and dedupe listings
- display listings in dashboard
- score strong listings
- receive Telegram alerts
- save/reject opportunities
- generate proposal drafts
