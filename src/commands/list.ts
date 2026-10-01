import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile } from "../utils/expertise.ts";
import { sortRecords } from "../utils/format.ts";
import { getRecordSummary } from "../schemas/record.ts";

export function registerListCommand(program: Command): void {
	program
		.command("list [domain]")
		.description("List all records, optionally filtered by domain")
		.action((domain?: string) => {
			const cwd = process.cwd();
			readConfig(cwd); // ensures .layer/ exists

			const domains = domain ? [domain] : getAllDomains(cwd);

			if (domains.length === 0) {
				console.log(chalk.dim("No domains yet. Run `lr add <domain>` first."));
				return;
			}

			let total = 0;
			for (const d of domains) {
				const records = sortRecords(readExpertiseFile(d, cwd));
				if (records.length === 0) continue;

				console.log(chalk.bold(`\n${d}`));
				console.log(chalk.dim("─".repeat(60)));

				for (const r of records) {
					const classLabel =
						r.classification === "foundational"
							? chalk.yellow("★")
							: r.classification === "observational"
								? chalk.dim("·")
								: " ";
					const typeLabel = chalk.cyan(r.type.padEnd(10));
					const summary = getRecordSummary(r).slice(0, 70);
					console.log(`  ${classLabel} ${typeLabel} ${chalk.dim(r.id)}  ${summary}`);
					total++;
				}
			}

			if (total === 0) {
				console.log(chalk.dim("No records yet. Run `lr record <domain> <type> --description \"...\"` to add one."));
			} else {
				console.log(chalk.dim(`\n${total} record${total === 1 ? "" : "s"}`));
			}
		});
}
