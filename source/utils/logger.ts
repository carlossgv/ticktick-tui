import fs from 'fs';

const LOG_FILE_PATH = '/tmp/inklog.txt';

function ensureLogFileExists() {
	if (!fs.existsSync(LOG_FILE_PATH)) {
		fs.writeFileSync(LOG_FILE_PATH, '');
	}
}

function getTimestamp(): string {
	return new Date().toISOString();
}

function logToFile(level: string, ...args: any[]) {
	if (process.env['DEV'] !== 'true') return;
	ensureLogFileExists();
	const message = args
		.map(arg => {
			if (typeof arg === 'object') {
				try {
					return JSON.stringify(arg, null, 2);
				} catch {
					return '[Circular]';
				}
			}
			return String(arg);
		})
		.join(' ');

	const logLine = `[${getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
	fs.appendFileSync(LOG_FILE_PATH, logLine);
}

export const Logger = {
	log: (...args: any[]) => logToFile('log', ...args),
	info: (...args: any[]) => logToFile('info', ...args),
	warn: (...args: any[]) => logToFile('warn', ...args),
	error: (...args: any[]) => logToFile('error', ...args),
	debug: (...args: any[]) => logToFile('debug', ...args),
};
