import React from 'react';
import { Box, Text } from 'ink';
import { Task } from '../types/tasks.types.js';
import { Spinner } from '@inkjs/ui';
import { convertUTCToLocalDate } from '../utils/dates.js';

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
		const localDate = convertUTCToLocalDate(task.startDate, timeZone);

		const now = new Date();
		const nowLocal = convertUTCToLocalDate(now.toISOString(), timeZone);

		const isToday =
			localDate.getFullYear() === nowLocal.getFullYear() &&
			localDate.getMonth() === nowLocal.getMonth() &&
			localDate.getDate() === nowLocal.getDate();

		if (task.isAllDay) {
			return isToday
				? ''
				: localDate.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				});
		} else {
			const hours = localDate.getHours();
			const minutes = localDate.getMinutes();
			if (isToday) {
				return hours === 0 && minutes === 0
					? ''
					: localDate.toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false,
					});
			} else {
				return localDate.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
				});
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
