import type { Command } from "commander";
import chalk from "chalk";
import { readConfig, getShelfLifeDays } from "../utils/config.ts";
import { getAllDomains, readArchiveFile, readExpertiseFile, writeArchiveFile, writeExpertiseFile } from "../utils/expertise.ts";
import type { LayerRecord } from "../schemas/record.ts";

export function registerPruneCommand(program: Command): void {
	program
		.command("prune")
		.description("Soft-archive records past their shelf life")
		.option("--hard", "Permanently delete instead of archiving")
		.option("--dry-run", "Preview what would be pruned without changing anything")
		.action((opts: { hard?: boolean; dryRun?: boolean }) => {
			const cwd = process.cwd();
			const config = readConfig(cwd);
			const now = Date.now();

			const tacticalDays = getShelfLifeDays("tactical", config);
			const observationalDays = getShelfLifeDays("observational", config);

			let totalPruned = 0;
			const domains = getAllDomains(cwd);

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd);
				const toKeep: LayerRecord[] = [];
				const toArchive: LayerRecord[] = [];

				for (const r of records) {
					if (r.status === "archived") {
						toKeep.push(r);
						continue;
					}
					if (r.classification === "foundational") {
						toKeep.push(r);
						continue;
					}

					const ageDays = (now - new Date(r.recorded_at).getTime()) / (1000 * 60 * 60 * 24);
					const limit =
						r.classification === "tactical" ? tacticalDays : observationalDays;

					if (ageDays > limit) {
						toArchive.push(r);
					} else {
						toKeep.push(r);
					}
				}

				if (toArchive.length === 0) continue;

				console.log(chalk.bold(`\n${domain}`) + chalk.dim(` — ${toArchive.length} to prune`));
				for (const r of toArchive) {
					const age = Math.floor(
						(now - new Date(r.recorded_at).getTime()) / (1000 * 60 * 60 * 24),
					);
					console.log(
						`  ${chalk.yellow("→")} ${chalk.cyan(r.type.padEnd(10))} ${chalk.dim(r.id)}  ${age}d old`,
					);
					totalPruned++;
				}

				if (!opts.dryRun) {
					if (opts.hard) {
						writeExpertiseFile(domain, toKeep, cwd);
					} else {
						const archived = toArchive.map((r) => ({
							...r,
							status: "archived" as const,
							archived_at: new Date().toISOString(),
							archive_reason: "stale" as const,
						}));
						const existing = readArchiveFile(domain, cwd);
						writeArchiveFile(domain, [...existing, ...archived], cwd);
						writeExpertiseFile(domain, toKeep, cwd);
					}
				}
			}

			if (totalPruned === 0) {
				console.log(chalk.dim("Nothing to prune."));
				return;
			}

			if (opts.dryRun) {
				console.log(chalk.dim(`\n${totalPruned} record${totalPruned === 1 ? "" : "s"} would be pruned (dry run — no changes made)`));
			} else if (opts.hard) {
				console.log(chalk.green(`\n✓ Permanently deleted ${totalPruned} record${totalPruned === 1 ? "" : "s"}`));
			} else {
				console.log(chalk.green(`\n✓ Archived ${totalPruned} record${totalPruned === 1 ? "" : "s"} to .layer/archive/`));
				console.log(chalk.dim("  Restore with: lr restore <id>"));
			}
		});
}
