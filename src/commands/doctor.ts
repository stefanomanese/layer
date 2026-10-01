import { existsSync } from "node:fs";
import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile, validateRecord, writeExpertiseFile } from "../utils/expertise.ts";

export function registerDoctorCommand(program: Command): void {
	program
		.command("doctor")
		.description("Validate record integrity across all domains")
		.option("--fix", "Remove broken file anchors automatically")
		.action((opts: { fix?: boolean }) => {
			const cwd = process.cwd();
			const config = readConfig(cwd);
			const domains = getAllDomains(cwd);

			let totalErrors = 0;
			let totalFixed = 0;

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd);
				let domainErrors = 0;
				const fixed: typeof records = [];

				// Check domain is declared in config
				if (!config.domains[domain]) {
					console.log(chalk.yellow(`⚠ Domain "${domain}" has a JSONL file but is not declared in layer.config.yaml`));
				}

				for (const record of records) {
					const errors = validateRecord(record);

					// Schema errors
					if (errors.length > 0) {
						console.log(chalk.red(`✗ ${record.id} (${domain}/${record.type})`));
						for (const e of errors) console.log(chalk.red(`    ${e}`));
						domainErrors += errors.length;
						totalErrors += errors.length;
						fixed.push(record);
						continue;
					}

					// Broken file anchors
					const brokenAnchors = (record.files ?? []).filter((f) => !existsSync(`${cwd}/${f}`));
					if (brokenAnchors.length > 0) {
						if (opts.fix) {
							const repaired = {
								...record,
								files: record.files?.filter((f) => !brokenAnchors.includes(f)),
							};
							if (repaired.files?.length === 0) delete repaired.files;
							fixed.push(repaired as typeof record);
							console.log(chalk.yellow(`  Fixed ${record.id}: removed broken anchor${brokenAnchors.length > 1 ? "s" : ""} (${brokenAnchors.join(", ")})`));
							totalFixed++;
						} else {
							console.log(chalk.yellow(`⚠ ${record.id} has broken file anchor${brokenAnchors.length > 1 ? "s" : ""}: ${brokenAnchors.join(", ")}`));
							fixed.push(record);
							domainErrors++;
							totalErrors++;
						}
					} else {
						fixed.push(record);
					}
				}

				if (opts.fix && totalFixed > 0) {
					writeExpertiseFile(domain, fixed, cwd);
				}

				if (domainErrors === 0 && domain in config.domains) {
					console.log(chalk.green(`✓ ${domain} — ${records.length} records OK`));
				}
			}

			console.log("");
			if (totalErrors === 0 && totalFixed === 0) {
				console.log(chalk.green("✓ All records are valid."));
			} else if (opts.fix) {
				console.log(chalk.green(`✓ Fixed ${totalFixed} issue${totalFixed === 1 ? "" : "s"}.`));
				if (totalErrors - totalFixed > 0) {
					console.log(chalk.red(`✗ ${totalErrors - totalFixed} issue${totalErrors - totalFixed === 1 ? "" : "s"} remain that need manual attention.`));
				}
			} else {
				console.log(chalk.red(`✗ ${totalErrors} issue${totalErrors === 1 ? "" : "s"} found. Run with --fix to repair broken anchors.`));
				process.exitCode = 1;
			}
		});
}
