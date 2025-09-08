import { UpdateTaskParams, TickTickReminder } from '../types/ticktick.types.js';
import * as chrono from 'chrono-node';
const DEFAULT_TIMEZONE = 'America/Santiago';
import { DateTime } from 'luxon';
import { TickTickClient } from '../clients/ticktick.client.js';
import { v4 as uuidv4 } from 'uuid';


const minutesFromToken = (num: number, unit: string | undefined) => {
	if (!unit) return NaN

	switch (unit.toLowerCase()) {
		case 'm': return num;          // minutes
		case 'h': return num * 60;     // hours
		case 'd': return num * 1440;   // days
		default: return NaN;
	}
};

type SimpleReminderParse = { reminders?: TickTickReminder[]; consumed: string[] };

const extractSimpleTriggers = (text: string): SimpleReminderParse => {
	const re = /(^|\s)(-(\d+)([mhd]))(?=\s|$)/gi;
	const consumed: string[] = [];
	const out: TickTickReminder[] = [];
	let m: RegExpExecArray | null;

	while ((m = re.exec(text)) !== null) {
		const full = m[2];       // e.g., "-30m"
		const num = Number(m[3]);
		const unit = m[4];

		const mins = minutesFromToken(num, unit);
		if (!Number.isFinite(mins)) continue;

		// Always "before" → negative minutes in TickTick format
		out.push({
			id: uuidv4(),
			trigger: `TRIGGER:-PT${Math.trunc(mins)}M`,
		});
		full && consumed.push(full);
	}

	// Dedup same trigger strings
	const uniq = new Map<string, TickTickReminder>();
	for (const r of out) uniq.set(r.trigger, r);
	return { reminders: uniq.size ? Array.from(uniq.values()) : undefined, consumed };
};

const cleanProjectName = (name: string) =>
	name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9\- ]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.toLowerCase();

const matchProjectIdByKey = async (
	projectKey: string,
	client: TickTickClient,
): Promise<string | undefined> => {
	const projects = await client.fetchProjects();
	const cleanedKey = cleanProjectName(projectKey);
	const match = projects.find(p => {
		const cleanedName = cleanProjectName(p.name);
		return cleanedName === cleanedKey || cleanedName.startsWith(cleanedKey);
	});
	return match?.id;
};

export type ParsedDates = {
	startDate?: string;
	dueDate?: string;
	timeZone?: string;
	dateTexts: string[];
	isAllDay?: boolean;
};

export const now = () => {
	return DateTime.fromJSDate(new Date(), { zone: DEFAULT_TIMEZONE })
		.toUTC()
		.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
		.replace(/(\+|-)\d\d:\d\d$/, '+0000');
};

export const extractDatesFromText = (text: string): ParsedDates => {
	const results = chrono.parse(text, new Date(), { forwardDate: true });

	let startDate: string | undefined;
	let dueDate: string | undefined;
	let isAllDay = true;
	const dateTexts: string[] = [];

	const formatToTickTick = (date: Date): string => {
		return DateTime.fromJSDate(date, { zone: DEFAULT_TIMEZONE })
			.toUTC()
			.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
			.replace(/(\+|-)\d\d:\d\d$/, '+0000');
	};

	if (results.length > 0) {
		const first = results[0];
		if (first?.start) {
			startDate = formatToTickTick(first.start.date());
			dateTexts.push(first.text);
			// Correct way to check for a time
			if (
				first.start.isCertain('hour') // 'hour' is present
			) {
				isAllDay = false;
			}
		}

		if (first?.end) {
			dueDate = formatToTickTick(first.end.date());
		} else if (results.length > 1) {
			const second = results[1];
			if (second?.start) {
				dueDate = formatToTickTick(second.start.date());
				dateTexts.push(second.text);
			}
		}
	}

	return { startDate, dueDate, timeZone: DEFAULT_TIMEZONE, dateTexts, isAllDay };
};

export const convertStringToTaskBody = async (
	str: string,
	client?: TickTickClient,
): Promise<UpdateTaskParams> => {
	const { startDate, dueDate, timeZone, dateTexts, isAllDay } =
		extractDatesFromText(str);

  const { reminders: userReminders, consumed: triggerTokens } = extractSimpleTriggers(str);


	const words = str.trim().split(/\s+/);
	const tags: string[] = [];
	const titleWords: string[] = [];
	let foundProjectKey: string | undefined;

	for (const word of words) {
		if (word.startsWith('#') && word.length > 1) {
			tags.push(word.slice(1));
		} else if (word.startsWith('~')) {
			foundProjectKey = word
				.slice(1)
				.replace(/[^a-zA-Z0-9\- ]/g, '')
				.toLowerCase();
		} else {
			titleWords.push(word);
		}
	}

  // Remove chrono phrases and trigger tokens from title
  const phrasesToRemove = [...dateTexts, ...triggerTokens].filter(Boolean);
  const title = titleWords
    .filter(w => !phrasesToRemove.some(txt => txt.includes(w)))
    .join(' ')
    .trim();

	let projectId: string | undefined = undefined;

	if (foundProjectKey && client) {
		projectId = await matchProjectIdByKey(foundProjectKey, client);
	}

	let reminders: TickTickReminder[] | undefined = undefined;
  // Only add reminders for timed tasks with startDate
  if (startDate && isAllDay === false) {
    if (userReminders?.length) {
      reminders = userReminders;
    } else {
      // keep your current default
      reminders = [{ id: uuidv4(), trigger: 'TRIGGER:PT0S' }];
    }
  }

	return {
		title,
		tags: tags.length > 0 ? tags : undefined,
		projectId,
		startDate,
		dueDate,
		timeZone,
		isAllDay: typeof isAllDay === 'boolean' ? isAllDay : true,
		reminders,
	};
};
