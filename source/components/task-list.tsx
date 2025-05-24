import React from 'react';
import { Box, Text } from 'ink';
import { Task } from '../types/tasks.types.js';
import { Spinner } from '@inkjs/ui';
import { DateTime } from 'luxon';

type TaskListProps = {
	tasks: Task[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const TaskList = ({ tasks, selectedIndex }: TaskListProps) => {

function parseDate(task: Task): string {
	if (!task.startDate) {
		return '';
	}

	const timeZone = task.timeZone || 'America/Santiago';

	const localDate = DateTime.fromISO(task.startDate, { zone: 'utc' }).setZone(timeZone);
	const nowLocal = DateTime.now().setZone(timeZone);

	const isToday =
		localDate.hasSame(nowLocal, 'day') &&
		localDate.hasSame(nowLocal, 'month') &&
		localDate.hasSame(nowLocal, 'year');

	if (task.isAllDay) {
		return isToday
			? ''
			: localDate.toFormat('MMM d'); // → e.g., "May 24"
	} else {
		if (isToday) {
			const isMidnight = localDate.hour === 0 && localDate.minute === 0;
			return isMidnight
				? ''
				: localDate.toFormat('HH:mm'); // → e.g., "14:30"
		} else {
			return localDate.toFormat('MMM d'); // → e.g., "May 24"
		}
	}
}

	return (
		<Box flexDirection="column" justifyContent='space-between' padding={1}>
			{tasks.length === 0 && <Spinner label="Loading" />}
			{tasks.map((task, index) => (
				<Text
					key={task.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{task.title}
					<Text color='yellow'>{task.tags?.length ? ` #${task.tags.join(' #')}` : ''}</Text>
					<Text>{task.startDate ? ` (${parseDate(task)})` : ''}</Text>
				</Text>
			))}
		</Box>
	);
};

export default TaskList;
