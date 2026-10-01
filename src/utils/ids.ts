import { randomBytes } from "node:crypto";

export function generateId(): string {
	return `lr-${randomBytes(3).toString("hex")}`;
}

export function isValidId(id: string): boolean {
	return /^lr-[0-9a-f]{6}$/.test(id);
}
