# Mobile production assessment

`apps/mobile` is currently a placeholder; no APK/AAB project or build exists, so mobile production readiness is not claimed. A future client must use environment-specific public API/Supabase URLs, the publishable/anon key only, OS secure storage for sessions, release version/build identifiers, and signing stores outside Git. It must never contain service-role, database, SMTP, Google client-secret, refresh-token, or server encryption credentials.
