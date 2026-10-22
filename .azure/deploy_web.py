"""Deploy the standalone IMP Agent UI; keep deployment credentials in memory."""
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
APP = "imp-agent-web"
GROUP = "imp-dev-rg"

def az(*args, allow_failure=False):
    result = subprocess.run(["az.cmd", *args, "-o", "json"], text=True, capture_output=True)
    if result.returncode:
        if allow_failure:
            return None
        print(result.stderr)
        raise RuntimeError("Azure CLI failed: " + " ".join(args[:3]))
    return json.loads(result.stdout) if result.stdout.strip() else None

existing = az("staticwebapp", "show", "-g", GROUP, "-n", APP, allow_failure=True)
if not existing:
    existing = az("staticwebapp", "create", "-g", GROUP, "-n", APP, "-l", "centralus", "--sku", "Free", "--tags", "application=imp-agent")
host = existing["defaultHostname"]
print("Standalone host:", host, flush=True)
token = az("staticwebapp", "secrets", "list", "-g", GROUP, "-n", APP)["properties"]["apiKey"]
environment = dict(os.environ, SWA_CLI_DEPLOYMENT_TOKEN=token, SWA_CLI_DEPLOY_ENV="production", SWA_CLI_SKIP_API_BUILD="true")
result = subprocess.run(["npx.cmd", "--yes", "@azure/static-web-apps-cli@2.1.0", "deploy", str(ROOT / "web"), "--env", "production"], env=environment, cwd=ROOT)
if result.returncode:
    raise RuntimeError("Static web deployment failed")
print("Static app deployed; moving the domain to its dedicated host", flush=True)
bindings = az("staticwebapp", "hostname", "list", "-g", GROUP, "-n", "imp-dev-web")
if any(binding.get("domainName") == "ask.impops.work" for binding in bindings):
    az("staticwebapp", "hostname", "delete", "-g", GROUP, "-n", "imp-dev-web", "--hostname", "ask.impops.work", "--yes")
az("network", "dns", "record-set", "cname", "set-record", "-g", GROUP, "-z", "impops.work", "-n", "ask", "-c", host, "--ttl", "300")
bindings = az("staticwebapp", "hostname", "list", "-g", GROUP, "-n", APP)
if not any(binding.get("domainName") == "ask.impops.work" for binding in bindings):
    az("staticwebapp", "hostname", "set", "-g", GROUP, "-n", APP, "--hostname", "ask.impops.work", "--validation-method", "cname-delegation", "--no-wait")
print("Domain points to the standalone IMP Agent; HTTPS validation requested", flush=True)
