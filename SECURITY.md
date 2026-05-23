# Security Policy

## Supported Versions

This repository is maintained from the `main` branch.

## Reporting a Vulnerability

If you find a vulnerability, please report it privately to the repository
owner or maintainer before opening a public issue. Include:

- Affected files or features
- Steps to reproduce
- Potential impact
- Suggested mitigation, if known

## Secret Handling

Do not commit `.env`, `.env.local`, service-role keys, OAuth secrets, database
URLs, API keys, private keys, or provider tokens. Rotate any credential that
has been committed to Git history or shared outside its intended secret store.
