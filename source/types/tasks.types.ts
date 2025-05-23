export type Task = {
	title: string;
	id: string;
	content: string;
	tags: string[];
	startDate?: string;
	dueDate?: string;
	timeZone: string;
	isAllDay?: boolean;
};
