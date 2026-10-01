import type { Command } from "commander";
import chalk from "chalk";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile } from "../utils/expertise.ts";
import { getChangedFiles, isGitRepo } from "../utils/git.ts";

export function registerLearnCommand(program: Command): void {
	program
		.command("learn")
		.description("Show changed files and which domains have anchored records")
		.action(() => {
			const cwd = process.cwd();
			readConfig(cwd);

			if (!isGitRepo(cwd)) {
				console.log(chalk.yellow("⚠ Not a git repository."));
				return;
			}

			const changed = getChangedFiles(cwd);
			if (changed.length === 0) {
				console.log(chalk.dim("No changed files since last commit."));
				return;
			}

			console.log(chalk.bold("Changed files:"));
			for (const f of changed) console.log(`  ${chalk.cyan(f)}`);

			// Find domains with records anchored to changed files
			const domains = getAllDomains(cwd);
			const relevant: { domain: string; count: number }[] = [];

			for (const domain of domains) {
				const records = readExpertiseFile(domain, cwd);
				const count = records.filter(
					(r) => r.files?.some((f) => changed.some((cf) => cf.includes(f) || f.includes(cf))),
				).length;
				if (count > 0) relevant.push({ domain, count });
			}

			if (relevant.length > 0) {
				console.log(chalk.bold("\nDomains with records anchored to these files:"));
				for (const { domain, count } of relevant) {
					console.log(`  ${chalk.yellow(domain)} — ${count} anchored record${count === 1 ? "" : "s"}`);
				}
			}

			console.log(chalk.dim("\nAnything worth recording? Run:"));
			console.log(chalk.cyan("  lr record <domain> <type> --description \"...\""));
		});
}
