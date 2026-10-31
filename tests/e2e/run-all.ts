import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

interface TierRun {
  name: string;
  tierNumber: number;
  filePath: string;
  passed: number;
  failed: number;
  durationMs: number;
  exitCode: number;
  output: string;
}

const TIERS = [
  { name: 'Tier 1 - Feature Coverage', tierNumber: 1, file: 'tier1-feature-coverage.test.ts' },
  { name: 'Tier 2 - Boundary & Corner Cases', tierNumber: 2, file: 'tier2-boundary-corner.test.ts' },
  { name: 'Tier 3 - Cross-Feature Combinations', tierNumber: 3, file: 'tier3-cross-feature.test.ts' },
  { name: 'Tier 4 - Real-World Parity & Build', tierNumber: 4, file: 'tier4-parity-and-build.test.ts' },
];

function runTier(tier: typeof TIERS[0]): Promise<TierRun> {
  const startTime = Date.now();
  const fullPath = resolve('tests/e2e', tier.file);

  return new Promise((resolveResult) => {
    const child = spawn(
      'node',
      ['--import', 'tsx', '--test', '--test-reporter', 'spec', fullPath],
      {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );

    let output = '';
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { output += d.toString(); });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      
      // Parse passed and failed counts from node:test summary (TAP or spec reporter)
      // TAP: "# pass 21", Spec: "ℹ pass 21"
      const passMatch = output.match(/(?:#|ℹ)?\s*pass\s+(\d+)/i);
      const failMatch = output.match(/(?:#|ℹ)?\s*fail\s+(\d+)/i);
      const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
      const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

      resolveResult({
        name: tier.name,
        tierNumber: tier.tierNumber,
        filePath: fullPath,
        passed,
        failed,
        durationMs,
        exitCode: code ?? 1,
        output,
      });
    });
  });
}

async function main() {
  console.log('========================================================================');
  console.log('  LIVIGNO PROJECT — 4-TIER E2E TEST & VERIFICATION SUITE');
  console.log('========================================================================\n');

  const results: TierRun[] = [];

  for (const tier of TIERS) {
    process.stdout.write(`Running [${tier.name}] (${tier.file})...\n`);
    const result = await runTier(tier);
    results.push(result);

    const statusBadge = result.failed === 0 ? '✓ PASSED' : `✖ FAILED (${result.failed} failures)`;
    console.log(`  -> ${statusBadge} | ${result.passed} passed, ${result.failed} failed (${(result.durationMs / 1000).toFixed(2)}s)\n`);

    if (result.failed > 0) {
      console.log('  --- Failure Details ---');
      const lines = result.output.split('\n');
      const failSnippet = lines
        .filter(l => l.includes('✖') || l.includes('AssertionError') || l.includes('Error:'))
        .slice(0, 10)
        .join('\n    ');
      console.log(`    ${failSnippet}\n`);
    }
  }

  // Summary Table
  console.log('========================================================================');
  console.log('  TEST EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log('| Tier | Name                              | Pass | Fail | Time (s) | Status |');
  console.log('|:----:|:----------------------------------|:----:|:----:|:--------:|:------:|');

  let totalPass = 0;
  let totalFail = 0;
  let totalDurationMs = 0;

  for (const r of results) {
    totalPass += r.passed;
    totalFail += r.failed;
    totalDurationMs += r.durationMs;
    const status = r.failed === 0 ? 'PASS' : 'FAIL';
    const row = `| T${r.tierNumber}   | ${r.name.padEnd(33)} | ${String(r.passed).padStart(4)} | ${String(r.failed).padStart(4)} | ${(r.durationMs / 1000).toFixed(2).padStart(8)} | ${status.padEnd(6)} |`;
    console.log(row);
  }

  console.log('------------------------------------------------------------------------');
  console.log(`Total: ${totalPass + totalFail} tests | Passed: ${totalPass} | Failed: ${totalFail} | Time: ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log('========================================================================\n');

  if (totalFail > 0) {
    console.log('Identified Implementation Defects for Escalation:');
    if (results.some(r => r.output.includes("extensions array ['jpg', 'jpeg', 'png'] must include 'webp'"))) {
      console.log('  [DEFECT 1] src/app/unidad/[id]/page.tsx:97 only probes [\'jpg\', \'jpeg\', \'png\']. Must add \'webp\' as primary extension.');
    }
    if (results.some(r => r.output.includes("getNavState() must include logic for 'unfurnished'"))) {
      console.log('  [DEFECT 2] src/app/unidad/[id]/page.tsx:292 getNavState() does not support navigation to \'unfurnished\' view mode.');
    }
    console.log('\nExit code: 1 (Failing tests detected)');
    process.exit(1);
  } else {
    console.log('All tests passed with 100% success rate! Verification suite ready.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
