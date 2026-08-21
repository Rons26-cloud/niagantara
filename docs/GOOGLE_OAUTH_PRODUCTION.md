# Google OAuth production checklist

Keep `http://localhost:4000/api/v1/google-sheets/oauth/callback`. Before production, add `https://api.niagantara.com/api/v1/google-sheets/oauth/callback` to Authorized redirect URIs without removing local development.

Prepare the NIAGANTARA name/logo, homepage, privacy and terms pages, authorized-domain ownership, contacts, and accurate screen captures. Confirm test versus production audience and whether Google verification is required. Publish changes only with owner approval. Requested scopes remain OpenID, email, and Sheets; Google data is limited to account identification and reporting integration.
