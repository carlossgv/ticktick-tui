import {TaskBody} from '../types/ticktick.types.js';
import * as chrono from 'chrono-node';
const DEFAULT_TIMEZONE = 'America/Santiago';

export const convertStringToTaskBody = (str: string): TaskBody => {
	const {startDate, dueDate, timeZone, dateTexts} = extractDatesFromText(str);

	const words = str.trim().split(/\s+/);
	const tags: string[] = [];
	const titleWords: string[] = [];

	for (const word of words) {
		if (word.startsWith('#') && word.length > 1) {
			tags.push(word.slice(1));
		} else {
			titleWords.push(word);
		}
	}

	// Remove date texts from title
	const title = titleWords
		.filter(word => !dateTexts.some(dateText => dateText.includes(word)))
		.join(' ')
		.trim();

	return {
		title,
		tags: tags.length > 0 ? tags : undefined,
		startDate,
		dueDate,
		timeZone,
	};
};

export type ParsedDates = {
	startDate?: string;
	dueDate?: string;
	timeZone?: string;
	dateTexts: string[];
};

export const extractDatesFromText = (text: string): ParsedDates => {
	const results = chrono.parse(text, new Date(), {forwardDate: true});

	let startDate: string | undefined;
	let dueDate: string | undefined;
	const dateTexts: string[] = [];

	if (results.length > 0) {
		const first = results[0];
		if (first?.start) {
			startDate = first.start.date().toISOString();
			dateTexts.push(first.text);
		}

		if (first?.end) {
			dueDate = first.end.date().toISOString();
		} else if (results.length > 1) {
			const second = results[1];
			if (second?.start) {
				dueDate = second.start.date().toISOString();
				dateTexts.push(second.text);
			}
		}
	}

	const timeZone = startDate ? DEFAULT_TIMEZONE : undefined;

	return {startDate, dueDate, timeZone, dateTexts};
};
