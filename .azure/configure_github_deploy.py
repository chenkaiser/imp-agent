"""Transfer this site's deployment token directly into its GitHub repository secret."""
import json
import subprocess

result = subprocess.run(
    ["az.cmd", "staticwebapp", "secrets", "list", "-g", "imp-dev-rg", "-n", "imp-agent-web", "-o", "json"],
    capture_output=True, text=True, check=True,
)
token = json.loads(result.stdout)["properties"]["apiKey"]
subprocess.run(
    ["gh", "secret", "set", "AZURE_STATIC_WEB_APPS_API_TOKEN_IMP_AGENT", "--repo", "chenkaiser/imp-agent"],
    input=token, text=True, check=True,
)
print("Configured AZURE_STATIC_WEB_APPS_API_TOKEN_IMP_AGENT for chenkaiser/imp-agent; token was not printed or written to disk.")
