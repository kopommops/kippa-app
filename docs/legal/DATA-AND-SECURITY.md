# Pelo Finance — Data and Security (draft)

**Version:** 2026-10-26-v1

Passwords are stored as password hashes rather than plaintext. Browser-to-service traffic uses HTTPS in deployment. Hosting and database providers document encryption controls, but Pelo Finance does not claim end-to-end encryption or absolute protection against unauthorised access.

Private account API routes require authentication and should enforce server-side account ownership. The app's PostgreSQL tables are intended to be accessed through the backend API; direct public Data API access should remain restricted. Do not store secrets in frontend code or collect bank passwords/OTPs.

Only synthetic data should be used in public demos until privacy, security, provider, and legal reviews have been completed. Backups, provider logs and deletion propagation may have distinct retention periods.

