import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile } from "../utils/expertise.ts";
import { getRecordSummary } from "../schemas/record.ts";

export function registerSearchCommand(program: Command): void {
	program
		.command("search <query>")
		.description("Full-text search across all active records")
		.option("-d, --domain <domain>", "Limit search to a specific domain")
		.action((query: string, opts: { domain?: string }) => {
			const cwd = process.cwd();
			readConfig(cwd);

			const lq = query.toLowerCase();
			const domains = opts.domain ? [opts.domain] : getAllDomains(cwd);
			let total = 0;

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd).filter(
					(r) => !r.status || r.status === "active",
				);

				const matches = records.filter((r) => {
					const summary = getRecordSummary(r).toLowerCase();
					const tags = (r.tags ?? []).join(" ").toLowerCase();
					const files = (r.files ?? []).join(" ").toLowerCase();
					return summary.includes(lq) || tags.includes(lq) || files.includes(lq);
				});

				if (matches.length === 0) continue;

				console.log(chalk.bold(`\n${domain}`));
				for (const r of matches) {
					const classLabel = r.classification === "foundational" ? chalk.yellow("★") : " ";
					console.log(
						`  ${classLabel} ${chalk.cyan(r.type.padEnd(10))} ${chalk.dim(r.id)}  ${highlight(getRecordSummary(r), query)}`,
					);
					total++;
				}
			}

			if (total === 0) {
				console.log(chalk.dim(`No records match "${query}".`));
			} else {
				console.log(chalk.dim(`\n${total} match${total === 1 ? "" : "es"}`));
			}
		});
}

function highlight(text: string, query: string): string {
	const idx = text.toLowerCase().indexOf(query.toLowerCase());
	if (idx === -1) return text.slice(0, 80);
	const before = text.slice(0, idx);
	const match = text.slice(idx, idx + query.length);
	const after = text.slice(idx + query.length, idx + query.length + 60);
	return `${before}${chalk.yellow(match)}${after}`;
}
