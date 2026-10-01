import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile } from "../utils/expertise.ts";
import type { RecordType, Classification } from "../schemas/record.ts";

const WARN_THRESHOLD = 100;

export function registerStatusCommand(program: Command): void {
	program
		.command("status")
		.description("Domain health overview")
		.action(() => {
			const cwd = process.cwd();
			const config = readConfig(cwd);
			const domains = getAllDomains(cwd);

			if (domains.length === 0) {
				console.log(chalk.dim("No domains yet. Run `lr add <domain>` first."));
				return;
			}

			let totalRecords = 0;
			console.log(chalk.bold("\nLayer Status\n"));

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd).filter(
					(r) => !r.status || r.status === "active",
				);
				const desc = config.domains[domain]?.description;

				const byType: Partial<Record<RecordType, number>> = {};
				const byClass: Partial<Record<Classification, number>> = {};
				let lastRecorded: Date | undefined;

				for (const r of records) {
					byType[r.type] = (byType[r.type] ?? 0) + 1;
					byClass[r.classification] = (byClass[r.classification] ?? 0) + 1;
					const d = new Date(r.recorded_at);
					if (!lastRecorded || d > lastRecorded) lastRecorded = d;
				}

				const countLabel =
					records.length >= WARN_THRESHOLD
						? chalk.yellow(`${records.length} records ⚠`)
						: chalk.green(`${records.length} records`);

				console.log(`  ${chalk.bold(domain)} ${countLabel}`);
				if (desc) console.log(`    ${chalk.dim(desc)}`);

				if (records.length > 0) {
					const typeSummary = Object.entries(byType)
						.map(([t, n]) => `${n} ${t}`)
						.join(", ");
					const classSummary = [
						byClass.foundational ? `${byClass.foundational}★` : null,
						byClass.tactical ? `${byClass.tactical} tactical` : null,
						byClass.observational ? `${byClass.observational} obs` : null,
					]
						.filter(Boolean)
						.join(", ");
					console.log(`    ${chalk.dim(typeSummary)}`);
					console.log(`    ${chalk.dim(classSummary)}`);
					if (lastRecorded) {
						console.log(`    ${chalk.dim("Last: " + lastRecorded.toLocaleDateString())}`);
					}
				}
				console.log("");
				totalRecords += records.length;
			}

			console.log(chalk.dim(`Total: ${totalRecords} active records across ${domains.length} domain${domains.length === 1 ? "" : "s"}`));
		});
}
