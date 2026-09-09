const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const mode = process.argv[2];
if (!['production', 'all'].includes(mode)) {
  throw new Error('Expected audit mode `production` or `all`.');
}

const yarnEntrypoint = process.env.npm_execpath;
if (!yarnEntrypoint) {
  throw new Error('Run this audit through Yarn.');
}

const exceptions = JSON.parse(
  readFileSync(join(process.cwd(), 'dependency-audit-exceptions.json'), 'utf8'),
);
for (const exception of exceptions) {
  if (!exception.id || !exception.path || !exception.expires || !exception.reason) {
    throw new Error(
      'Every dependency audit exception requires id, path, expires, and reason.',
    );
  }
}

const auditArguments = [yarnEntrypoint, 'audit', '--json'];
if (mode === 'production') {
  auditArguments.push('--groups', 'dependencies');
}

let output;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    output = execFileSync(process.execPath, auditArguments, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    output = error.stdout;
    if (output && output.includes('"type":"auditSummary"')) {
      break;
    }
    if (attempt === 3) {
      process.stderr.write(error.stderr ?? 'Dependency audit failed.\n');
      process.exit(1);
    }
  }
}

const reports = output
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const summary = reports.find((report) => report.type === 'auditSummary');
if (!summary) {
  throw new Error('The registry returned no audit summary.');
}

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const findings = reports
  .filter((report) => report.type === 'auditAdvisory')
  .map((report) => ({
    id:
      report.data.advisory.github_advisory_id ??
      String(report.data.advisory.id),
    module: report.data.advisory.module_name,
    path: report.data.resolution.path,
    severity: report.data.advisory.severity,
    recommendation: report.data.advisory.recommendation,
  }));

const gatedFindings = findings.filter(
  (finding) => severityRank[finding.severity] >= severityRank.high,
);

const today = new Date().toISOString().slice(0, 10);
const blocked = [];
const allowed = [];
for (const finding of gatedFindings) {
  const exception = exceptions.find(
    (candidate) =>
      candidate.id === finding.id && candidate.path === finding.path,
  );
  if (exception && exception.expires >= today) {
    allowed.push({ ...finding, exception });
  } else {
    blocked.push(finding);
  }
}

const vulnerabilities = summary.data.vulnerabilities;
console.log(
  `${mode} dependency audit: ${vulnerabilities.critical} critical, ${vulnerabilities.high} high, ${vulnerabilities.moderate} moderate, ${vulnerabilities.low} low`,
);
for (const finding of allowed) {
  console.log(
    `ALLOW ${finding.id}|${finding.path} through ${finding.exception.expires}: ${finding.exception.reason}`,
  );
}
for (const finding of blocked) {
  console.error(
    `BLOCK ${finding.severity.toUpperCase()} ${finding.id}|${finding.path} (${finding.module}): ${finding.recommendation}`,
  );
}
for (const finding of findings.filter(
  (candidate) => severityRank[candidate.severity] < severityRank.high,
)) {
  console.log(
    `INFO ${finding.severity.toUpperCase()} ${finding.id}|${finding.path} (${finding.module}): ${finding.recommendation}`,
  );
}

if (blocked.length > 0) {
  process.exit(1);
}

console.log(`Passed ${mode} dependency audit high/critical gate.`);
