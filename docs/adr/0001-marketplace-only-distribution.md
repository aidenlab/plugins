# Geenee is distributed only through the marketplace

Geenee is installed only by adding the `aidenlab/plugins` marketplace and installing `geenee@aidenlab`, in every app. Onboarding never offers the shorter route of pasting the server address (`https://geenee.3dg.io/mcp`) as a custom connector or custom MCP server, not even as a fallback. Geenee is in early development, and only a marketplace install receives plugin updates (the skill and its instructions) as we ship them. A hand-added address freezes the user on whatever they first got.

## Consequences

- When a step fails, the user is sent to GitHub Issues on `aidenlab/plugins`, not to a second install route.
- Claude Team/Enterprise admins may still need to allow user-added marketplaces, or add the plugin's connector for the organization. That is part of the marketplace install, not an alternative to it.
