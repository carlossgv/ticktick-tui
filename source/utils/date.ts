import { DateTime } from "luxon";
import { DEFAULT_TIMEZONE } from "./text-parser.js";

export const ticktickDate = (date: Date): string => {
		return DateTime.fromJSDate(date, {zone: DEFAULT_TIMEZONE})
			.toUTC()
			.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ")
			.replace(/(\+|-)\d\d:\d\d$/, '+0000'); // Ensure +0000 format
}
