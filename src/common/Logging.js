export default function logMessage(s, logger = console.log) {
	logger(timestamp(s));
}

export function timestamp(s) {
	let d = new Date();
	let ts = `[${d.toLocaleTimeString("en-US", { hour12: false })}]`;
	return `${ts} ${s}`;
}