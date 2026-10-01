import { type LayerRecord, type Classification, getRecordSummary, getRecordName } from "../schemas/record.ts";

const CLASS_SYMBOL: Record<Classification, string> = {
	foundational: " ★",
	tactical: "",
	observational: " ·",
};

// Compact one-liner per record: [type ★] **name** summary
export function formatCompact(record: LayerRecord): string {
	const symbol = CLASS_SYMBOL[record.classification];
	const tag = `[${record.type}${symbol}]`;
	const name = getRecordName(record);
	const summary = getRecordSummary(record);
	return name ? `${tag} **${name}** ${summary}` : `${tag} ${summary}`;
}

// XML compact: one <r> per record
export function formatXmlRecord(record: LayerRecord): string {
	const summary = getRecordSummary(record);
	const name = getRecordName(record);
	const nameAttr = name ? ` name="${escapeXml(name)}"` : "";
	return `    <r type="${record.type}" class="${record.classification}"${nameAttr}>${escapeXml(summary)}</r>`;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Sort order: foundational first, then tactical, then observational; within tier by recorded_at desc
const CLASS_ORDER: Record<Classification, number> = {
	foundational: 0,
	tactical: 1,
	observational: 2,
};

export function sortRecords(records: LayerRecord[]): LayerRecord[] {
	return [...records].sort((a, b) => {
		const co = CLASS_ORDER[a.classification] - CLASS_ORDER[b.classification];
		if (co !== 0) return co;
		return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
	});
}

export function filterByFiles(records: LayerRecord[], filterFiles: string[]): LayerRecord[] {
	return records.filter((r) => {
		if (!r.files || r.files.length === 0) return false;
		return r.files.some((f) => filterFiles.some((ff) => f.includes(ff) || ff.includes(f)));
	});
}

interface PrimeOptions {
	format?: "compact" | "xml";
	filterFiles?: string[];
}

export function formatPrimeOutput(
	byDomain: Record<string, LayerRecord[]>,
	opts: PrimeOptions = {},
): string {
	const { format = "compact" } = opts;
	const domains = Object.keys(byDomain);
	if (domains.length === 0) return "";

	if (format === "xml") {
		const lines = ["<layer_expertise>"];
		for (const domain of domains) {
			const records = byDomain[domain] ?? [];
			if (records.length === 0) continue;
			lines.push(`  <domain name="${domain}">`);
			for (const r of records) lines.push(formatXmlRecord(r));
			lines.push("  </domain>");
		}
		lines.push("</layer_expertise>");
		return lines.join("\n");
	}

	// Compact (default)
	const lines = ["## Layer — Project Expertise", ""];
	for (const domain of domains) {
		const records = byDomain[domain] ?? [];
		if (records.length === 0) continue;
		lines.push(`### ${domain}`);
		for (const r of records) lines.push(formatCompact(r));
		lines.push("");
	}
	lines.push("---");
	lines.push("Session complete? `lr learn` → `lr record <domain> <type> --description \"...\"` → `lr sync`");
	return lines.join("\n");
}
