export function convertUTCToLocalDate(isoDateStr: string, timeZone: string): Date {
	const date = new Date(isoDateStr);
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
	const parts = formatter.formatToParts(date);
	const dateComponents: { [key: string]: string } = {};
	for (const part of parts) {
		if (part.type !== 'literal') {
			dateComponents[part.type] = part.value;
		}
	}
	return new Date(
		`${dateComponents['year']}-${dateComponents['month']}-${dateComponents['day']}T${dateComponents['hour']}:${dateComponents['minute']}:00`
	);
}
