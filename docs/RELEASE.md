# Release process

Use semantic versions and immutable SHAs. Release notes cover behavior, migrations, configuration, security, and recovery impact. CI must pass before tagging. Stage and smoke-test the exact artifact; approve database changes separately; deploy API, verify readiness, then worker and frontends. Roll back application artifacts by SHA and use forward-fix database migrations.
