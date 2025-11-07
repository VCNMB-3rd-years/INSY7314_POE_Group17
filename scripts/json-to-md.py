import json
import sys

if len(sys.argv) < 2:
    print("Usage: python json-to-md.py <trivy-json-file>")
    sys.exit(1)

input_file = sys.argv[1]

with open(input_file) as f:
    data = json.load(f)

print("| Vulnerability | Severity | Package | Fix Available |")
print("|---------------|---------|--------|---------------|")

for result in data.get("Results", []):
    for vuln in result.get("Vulnerabilities", []):
        print(
            f"| {vuln.get('VulnerabilityID','')} "
            f"| {vuln.get('Severity','')} "
            f"| {vuln.get('PkgName','')} "
            f"| {vuln.get('FixedVersion','')} |"
        )
