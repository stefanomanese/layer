import type { Command } from "commander";
import chalk from "chalk";
import { readConfig, writeConfig } from "../utils/config.ts";
import { initDomainFile } from "../utils/expertise.ts";

export function registerAddCommand(program: Command): void {
	program
		.command("add <domain>")
		.description("Add a new domain to this project")
		.option("-d, --description <text>", "Short description of what this domain covers")
		.action((domain: string, opts: { description?: string }) => {
			const cwd = process.cwd();
			const config = readConfig(cwd);

			if (config.domains[domain]) {
				console.log(chalk.yellow(`⚠ Domain "${domain}" already exists.`));
				return;
			}

			config.domains[domain] = opts.description ? { description: opts.description } : {};
			writeConfig(config, cwd);
			initDomainFile(domain, cwd);

			console.log(chalk.green(`✓ Added domain "${domain}"`));
			console.log(`  Next: ${chalk.cyan(`lr record ${domain} <type> --description "..."`)}`);
		});
}
