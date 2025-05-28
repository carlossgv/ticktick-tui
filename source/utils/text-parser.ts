import { TaskBody } from '../types/ticktick.types.js';
import * as chrono from 'chrono-node';
const DEFAULT_TIMEZONE = 'America/Santiago';
import { DateTime } from 'luxon';

export const convertStringToTaskBody = (str: string): TaskBody => {
	return {
		title: str.trim(),
		tags: [],
		startDate: undefined,
		dueDate: undefined,
		timeZone: DEFAULT_TIMEZONE,
		isAllDay: true,
	}
	// const { startDate, dueDate, timeZone, dateTexts } = extractDatesFromText(str);
	//
	// const words = str.trim().split(/\s+/);
	// const tags: string[] = [];
	// const titleWords: string[] = [];
	//
	// for (const word of words) {
	// 	if (word.startsWith('#') && word.length > 1) {
	// 		tags.push(word.slice(1));
	// 	} else {
	// 		titleWords.push(word);
	// 	}
	// }
	//
	// // Remove date texts from title
	// const title = titleWords
	// 	.filter(word => !dateTexts.some(dateText => dateText.includes(word)))
	// 	.join(' ')
	// 	.trim();
	//
	// return {
	// 	title,
	// 	tags: tags.length > 0 ? tags : undefined,
	// 	startDate,
	// 	dueDate,
	// 	timeZone,
	// 	isAllDay: startDate ? false : true,
	// };
};

export type ParsedDates = {
	startDate?: string;
	dueDate?: string;
	timeZone?: string;
	dateTexts: string[];
};

// export const extractDatesFromText = (text: string): ParsedDates => {
// 	const results = chrono.parse(text, new Date(), { forwardDate: true });
//
// 	let startDate: string | undefined;
// 	let dueDate: string | undefined;
// 	const dateTexts: string[] = [];
//
// 	const formatToTickTick = (date: Date): string => {
// 		return DateTime.fromJSDate(date, { zone: DEFAULT_TIMEZONE })
// 			.toUTC()
// 			.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
// 			.replace(/(\+|-)\d\d:\d\d$/, '+0000'); // Ensure +0000 format
// 	};
//
// 	if (results.length > 0) {
// 		const first = results[0];
// 		if (first?.start) {
// 			startDate = formatToTickTick(first.start.date());
// 			dateTexts.push(first.text);
// 		}
//
// 		if (first?.end) {
// 			dueDate = formatToTickTick(first.end.date());
// 		} else if (results.length > 1) {
// 			const second = results[1];
// 			if (second?.start) {
// 				dueDate = formatToTickTick(second.start.date());
// 				dateTexts.push(second.text);
// 			}
// 		}
// 	}
//
// 	return { startDate, dueDate, timeZone: DEFAULT_TIMEZONE, dateTexts };
// };
