import type { Command } from "commander";
import { readConfig } from "../utils/config.ts";
import { getAllDomains, readExpertiseFile } from "../utils/expertise.ts";
import { filterByFiles, formatPrimeOutput, sortRecords } from "../utils/format.ts";

interface PrimeOptions {
	files?: string;
	format?: string;
}

export function registerPrimeCommand(program: Command): void {
	program
		.command("prime [domain]")
		.description("Output expertise for context injection (runs via SessionStart hook)")
		.option("--files <paths>", "Only show records anchored to these comma-separated paths")
		.option("--format <fmt>", "Output format: compact (default) | xml")
		.action((domain: string | undefined, opts: PrimeOptions) => {
			const cwd = process.cwd();

			try {
				readConfig(cwd);
			} catch {
				// No .layer/ — silent exit so the hook doesn't break new projects
				process.exit(0);
			}

			const filterFiles = opts.files
				? opts.files.split(",").map((f) => f.trim())
				: undefined;

			const format = opts.format === "xml" ? "xml" : "compact";
			const domains = domain ? [domain] : getAllDomains(cwd);
			const byDomain: Record<string, ReturnType<typeof readExpertiseFile>> = {};

			for (const d of domains) {
				let records = readExpertiseFile(d, cwd).filter(
					(r) => !r.status || r.status === "active",
				);
				if (filterFiles) records = filterByFiles(records, filterFiles);
				records = sortRecords(records);
				if (records.length > 0) byDomain[d] = records;
			}

			const output = formatPrimeOutput(byDomain, { format, filterFiles });
			if (output) console.log(output);
		});
}
