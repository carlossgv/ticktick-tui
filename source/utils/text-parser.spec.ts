import {extractDatesFromText} from './text-parser.js';

describe('TextParser', () => {
	describe('extractDatesFromText', () => {
		it('should parse single date expressions', () => {
			const input = 'Meeting tomorrow at 10am';
			const result = extractDatesFromText(input);
			expect(result.startDate).toBeDefined();
			expect(result.dueDate).toBeUndefined();
			expect(result.timeZone).toBe('America/Santiago');
			expect(result.dateTexts).toContain('tomorrow at 10am');
		});

		it('should parse date ranges', () => {
			const input = 'Project from May 26 to June 1';
			const result = extractDatesFromText(input);
			expect(result.startDate).toBeDefined();
			expect(result.dueDate).toBeDefined();
			expect(result.timeZone).toBe('America/Santiago');
			expect(result.dateTexts).toContain('May 26');
			expect(result.dateTexts).toContain('June 1');
		});

		it('should return undefined for no date expressions', () => {
			const input = 'Just a regular task without dates';
			const result = extractDatesFromText(input);
			expect(result.startDate).toBeUndefined();
			expect(result.dueDate).toBeUndefined();
			expect(result.timeZone).toBeUndefined();
			expect(result.dateTexts).toEqual([]);
		});
	});
});
