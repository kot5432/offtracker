# Operational monitor rollout

This staged workflow verifies 18 offline tests on Ubuntu/Node 24 without database credentials or HTTP pings.
Production code is pinned to commit ab5879a0064983bd96880626f7daf6e2090562e5; updating the checkout pin is part of reviewing any code update.
The push-triggered validation intentionally tests that pinned code, not arbitrary future source changes.

Production observation is scheduled every five minutes (minutes 02,07,...,57 UTC). The first real credentialed run successfully read both statuses; delivery is pending a fresh completion window. A manual run with run_monitor=true performs one read and only sends fixed, bodyless Healthchecks GET requests for verified fresh success. Missing credentials fail closed.
The dedicated database identity and three secrets have been configured. Keep the offtracker-operations environment for the main branch only. Store these three environment secrets:
- OFFTRACKER_MONITOR_PGPASSWORD (new dedicated monitor credential)
- OFFTRACKER_RETENTION_PING_URL (existing retention check)
- OFFTRACKER_CLEANUP_PING_URL (existing history cleanup check)

Never store admin/service-role keys, recipient addresses, feedback messages, or PC activity in this repository.
The parent reader stays NOLOGIN; the dedicated monitor uses explicit SET ROLE and cannot read feedback content.
TLS verifies the pinned CA and hostname. PostgreSQL client environment overrides are discarded.

A successful offline validation is not proof of production login, Healthchecks delivery, or email delivery.
Check production delivery during a fresh completion window: retention runs hourly at minute 07 UTC, cleanup daily at 02:37 UTC; the code accepts completion timestamps younger than 10 minutes.
The schedule was enabled after the first successful production read so real completion windows can be observed without a person repeatedly starting runs. Verify the first scheduled run and actual Healthchecks delivery separately; enabled is not the same as end-to-end verified. Keep the website intake disabled until its independent release checks pass.

Rollback: remove the schedule, revoke the monitor's reader membership, disable login, clear its password and terminate only its sessions. Then remove its GitHub credential. Do not alter retention/cleanup jobs to simulate a failure.
GitHub schedule delays and public-repository inactivity suspension remain operational limitations.
