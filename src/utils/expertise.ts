import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Ajv from "ajv";
import { getLayerDir } from "./config.ts";
import { NAMED_TYPES, type LayerRecord, type RecordType, getRecordName, recordSchemas } from "../schemas/record.ts";

const ajv = new Ajv({ strict: true });

export function getExpertiseDir(cwd: string = process.cwd()): string {
	return join(getLayerDir(cwd), "expertise");
}

export function getArchiveDir(cwd: string = process.cwd()): string {
	return join(getLayerDir(cwd), "archive");
}

export function getExpertisePath(domain: string, cwd: string = process.cwd()): string {
	return join(getExpertiseDir(cwd), `${domain}.jsonl`);
}

export function getArchivePath(domain: string, cwd: string = process.cwd()): string {
	return join(getArchiveDir(cwd), `${domain}.jsonl`);
}

export function readExpertiseFile(domain: string, cwd: string = process.cwd()): LayerRecord[] {
	const path = getExpertisePath(domain, cwd);
	if (!existsSync(path)) return [];
	return readFileSync(path, "utf-8")
		.split("\n")
		.filter((line) => line.trim())
		.map((line) => JSON.parse(line) as LayerRecord);
}

export function readArchiveFile(domain: string, cwd: string = process.cwd()): LayerRecord[] {
	const path = getArchivePath(domain, cwd);
	if (!existsSync(path)) return [];
	return readFileSync(path, "utf-8")
		.split("\n")
		.filter((line) => line.trim())
		.map((line) => JSON.parse(line) as LayerRecord);
}

// Atomic write: write to temp file then rename
export function writeExpertiseFile(domain: string, records: LayerRecord[], cwd: string = process.cwd()): void {
	const path = getExpertisePath(domain, cwd);
	const tmp = `${path}.tmp`;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(tmp, records.map((r) => JSON.stringify(r)).join("\n") + (records.length > 0 ? "\n" : ""), "utf-8");
	renameSync(tmp, path);
}

export function writeArchiveFile(domain: string, records: LayerRecord[], cwd: string = process.cwd()): void {
	const path = getArchivePath(domain, cwd);
	const tmp = `${path}.tmp`;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(tmp, records.map((r) => JSON.stringify(r)).join("\n") + (records.length > 0 ? "\n" : ""), "utf-8");
	renameSync(tmp, path);
}

export function appendRecord(domain: string, record: LayerRecord, cwd: string = process.cwd()): void {
	const path = getExpertisePath(domain, cwd);
	mkdirSync(dirname(path), { recursive: true });
	if (!existsSync(path)) writeFileSync(path, "", "utf-8");
	appendFileSync(path, JSON.stringify(record) + "\n", "utf-8");
}

export function validateRecord(record: LayerRecord): string[] {
	const schema = recordSchemas[record.type];
	const validate = ajv.compile(schema);
	if (!validate(record)) {
		return (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
	}
	return [];
}

// Named types: upsert by name/title. Unnamed types: skip exact content match.
export function findDuplicate(
	record: LayerRecord,
	existing: LayerRecord[],
): LayerRecord | undefined {
	if (NAMED_TYPES.includes(record.type)) {
		const name = getRecordName(record);
		if (!name) return undefined;
		return existing.find((r) => r.type === record.type && getRecordName(r) === name);
	}
	// Unnamed: exact content match
	if (record.type === "convention") {
		return existing.find(
			(r) => r.type === "convention" && (r as { content: string }).content === (record as { content: string }).content,
		);
	}
	if (record.type === "failure") {
		return existing.find(
			(r) => r.type === "failure" && (r as { description: string }).description === (record as { description: string }).description,
		);
	}
	return undefined;
}

// Upsert: replace the matching record in place
export function upsertRecord(
	domain: string,
	record: LayerRecord,
	existingId: string,
	cwd: string = process.cwd(),
): void {
	const records = readExpertiseFile(domain, cwd);
	const idx = records.findIndex((r) => r.id === existingId);
	if (idx === -1) {
		appendRecord(domain, record, cwd);
	} else {
		records[idx] = record;
		writeExpertiseFile(domain, records, cwd);
	}
}

export function getAllDomains(cwd: string = process.cwd()): string[] {
	const dir = getExpertiseDir(cwd);
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith(".jsonl"))
		.map((f) => f.replace(".jsonl", ""));
}

export function findRecordById(id: string, cwd: string = process.cwd()): { record: LayerRecord; domain: string } | undefined {
	const domains = getAllDomains(cwd);
	for (const domain of domains) {
		const records = readExpertiseFile(domain, cwd);
		const record = records.find((r) => r.id === id);
		if (record) return { record, domain };
	}
	return undefined;
}

export function findArchivedById(id: string, cwd: string = process.cwd()): { record: LayerRecord; domain: string } | undefined {
	const domains = getAllDomains(cwd);
	for (const domain of domains) {
		const records = readArchiveFile(domain, cwd);
		const record = records.find((r) => r.id === id);
		if (record) return { record, domain };
	}
	return undefined;
}

export function initDomainFile(domain: string, cwd: string = process.cwd()): void {
	const path = getExpertisePath(domain, cwd);
	mkdirSync(dirname(path), { recursive: true });
	if (!existsSync(path)) writeFileSync(path, "", "utf-8");
}
