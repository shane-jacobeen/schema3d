# Security Policy

## Supported Versions

Security fixes are applied to the latest release on the `main` branch.

## Reporting a Vulnerability

If you discover a security vulnerability in Schema3D, please report it responsibly:

1. **Do not** open a public GitHub issue for security-sensitive reports.
2. Email the maintainer via the contact listed on [schema3d.com](https://schema3d.com) or open a private security advisory on GitHub if you have access.
3. Include a clear description, steps to reproduce, and impact assessment if possible.

We aim to acknowledge reports within 72 hours and will coordinate disclosure once a fix is available.

## Scope

Schema3D is a client-side visualization tool. Reports related to:

- Malicious schema input causing unexpected client behavior
- XSS via shared URLs or schema text
- Dependency vulnerabilities

are in scope. The production Vercel deployment serves static files only; the optional Express server is used for local development and self-hosted static serving.
