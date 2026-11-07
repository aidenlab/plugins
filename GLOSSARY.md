# Aiden Lab plugins

How Aiden Lab's tools, starting with Geenee, reach people's AI assistants.

## Language

**Marketplace**:
The `aidenlab/plugins` GitHub repository, added to an app once by name, that lists Aiden Lab's plugins and carries their updates.
_Avoid_: catalog, store, repo (when talking to users)

**Plugin**:
An installable package from the Marketplace that bundles a Connector and a skill. Geenee is one.
_Avoid_: app, extension, integration

**Connector**:
An app's saved connection to the Geenee server, which supplies the tools.
_Avoid_: MCP server (when talking to users), integration

**Marketplace install**:
The only supported way to set up Geenee: add the Marketplace, then install the Plugin from it. See ADR 0001.
_Avoid_: Option A, the plugin route

**Custom connector**:
A Connector added by pasting the server address by hand. Not offered to users; it gets no updates.
_Avoid_: Option B, manual install, URL install

**Connect step**:
The click in Claude that switches on a Plugin's Connector after the Plugin is added. Claude never does it automatically.
