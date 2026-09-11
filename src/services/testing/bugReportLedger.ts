import type { IBugReport } from '../../model/crawlerTesting.contracts';

export interface IBugLedgerMetrics {
  readonly criticalBugsCount: number;
  readonly warningBugsCount: number;
  readonly ergonomicsBugsCount: number;
  readonly infoBugsCount: number;
  readonly totalBugsCount: number;
}

export class BugReportLedger {
  private reports: IBugReport[] = [];

  public addReport(report: IBugReport): void {
    // Avoid duplicate reports by id or title+target
    const exists = this.reports.some(
      (r) => r.id === report.id || (r.title === report.title && r.targetComponentOrNodeId === report.targetComponentOrNodeId)
    );
    if (!exists) {
      this.reports.push(report);
    }
  }

  public addReports(reports: readonly IBugReport[]): void {
    for (const r of reports) {
      this.addReport(r);
    }
  }

  public getAllReports(): readonly IBugReport[] {
    return [...this.reports];
  }

  public getMetrics(): IBugLedgerMetrics {
    let critical = 0;
    let warning = 0;
    let ergonomics = 0;
    let info = 0;

    for (const r of this.reports) {
      if (r.severity === 'CRITICAL') critical++;
      else if (r.severity === 'WARNING') warning++;
      else if (r.severity === 'ERGONOMICS') ergonomics++;
      else if (r.severity === 'INFO') info++;
    }

    return {
      criticalBugsCount: critical,
      warningBugsCount: warning,
      ergonomicsBugsCount: ergonomics,
      infoBugsCount: info,
      totalBugsCount: this.reports.length,
    };
  }

  public clear(): void {
    this.reports = [];
  }

  public exportAsJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        summary: this.getMetrics(),
        reports: this.reports,
      },
      null,
      2
    );
  }

  public exportAsMarkdown(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [
      `# 🐞 RICIS-III Automated Testing Bug Report`,
      ``,
      `**Generated at**: ${new Date().toISOString()}`,
      `**Total Defects**: ${metrics.totalBugsCount} (🚨 Critical: ${metrics.criticalBugsCount}, ⚠️ Warning: ${metrics.warningBugsCount}, 🎨 Ergonomics: ${metrics.ergonomicsBugsCount}, ℹ️ Info: ${metrics.infoBugsCount})`,
      ``,
      `---`,
      ``,
    ];

    if (this.reports.length === 0) {
      lines.push(`*No defects detected during testing session.*`);
      return lines.join('\n');
    }

    this.reports.forEach((bug, idx) => {
      lines.push(`## Bug Report #${idx + 1}: [${bug.severity}] ${bug.title}`);
      lines.push(`- **ID**: \`${bug.id}\``);
      lines.push(`- **Category**: \`${bug.category}\``);
      lines.push(`- **Target Component / Node**: \`${bug.targetComponentOrNodeId}\``);
      lines.push(`- **Description**: ${bug.description}`);
      lines.push(`- **Expected Behavior**: ${bug.expectedBehavior}`);
      lines.push(`- **Actual Behavior**: ${bug.actualBehavior}`);
      lines.push(`- **Reproduction Steps**:`);
      bug.reproductionSteps.forEach((step, sIdx) => {
        lines.push(`  ${sIdx + 1}. ${step}`);
      });
      if (bug.telemetryData && Object.keys(bug.telemetryData).length > 0) {
        lines.push(`- **Telemetry Details**:`);
        lines.push(`\`\`\`json`);
        lines.push(JSON.stringify(bug.telemetryData, null, 2));
        lines.push(`\`\`\``);
      }
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    });

    return lines.join('\n');
  }
}
