// import test from 'ava';
// import {extractDatesFromText} from './text-parser.js';
//
// test('parses single date expression', t => {
// 	const input = 'Meeting tomorrow at 10am';
// 	const result = extractDatesFromText(input);
//
// 	t.truthy(result.startDate);
// 	t.falsy(result.dueDate);
// 	t.is(result.timeZone, 'America/Santiago');
// 	t.deepEqual(result.dateTexts, ['tomorrow at 10am']);
// });
//
// test('parses date range', t => {
// 	const input = 'Project from May 26 to June 1';
// 	const result = extractDatesFromText(input);
//
// 	t.truthy(result.startDate);
// 	t.truthy(result.dueDate);
// 	t.is(result.timeZone, 'America/Santiago');
// 	t.deepEqual(result.dateTexts, ['May 26', 'June 1']);
// });
//
// test('returns undefined for no date expressions', t => {
// 	const input = 'Just a regular task without dates';
// 	const result = extractDatesFromText(input);
//
// 	t.falsy(result.startDate);
// 	t.falsy(result.dueDate);
// 	t.falsy(result.timeZone);
// 	t.deepEqual(result.dateTexts, []);
// });
