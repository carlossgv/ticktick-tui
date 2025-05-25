import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { Task } from '../types/tasks.types.js';
import { Spinner } from '@inkjs/ui';
import { DateTime } from 'luxon';

type TaskListProps = {
	tasks: Task[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const VISIBLE_COUNT = 10;

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
				: localDate.toFormat('MMM d');
		} else {
			if (isToday) {
				const isMidnight = localDate.hour === 0 && localDate.minute === 0;
				return isMidnight
					? ''
					: localDate.toFormat('HH:mm');
			} else {
				return localDate.toFormat('MMM d');
			}
		}
	}

	const scrollOffset = useMemo(() => {
		if (selectedIndex < VISIBLE_COUNT) return 0;
		return selectedIndex - VISIBLE_COUNT + 1;
	}, [selectedIndex]);

	const visibleTasks = tasks.slice(scrollOffset, scrollOffset + VISIBLE_COUNT);

	return (
		<Box flexDirection="column" justifyContent="space-between" padding={1}>
			{tasks.length === 0 && <Spinner label="Loading" />}

			{scrollOffset > 0 && <Text color="gray">↑ More</Text>}

			{visibleTasks.map((task, index) => {
				const actualIndex = scrollOffset + index;
				const isSelected = actualIndex === selectedIndex;

				return (
					<Text
						key={task.id}
						color={isSelected ? 'black' : undefined}
						backgroundColor={isSelected ? 'cyan' : undefined}
					>
						{task.title}
						<Text color="yellow">
							{task.tags?.length ? ` #${task.tags.join(' #')}` : ''}
						</Text>
						<Text>{task.startDate ? ` (${parseDate(task)})` : ''}</Text>
					</Text>
				);
			})}

			{scrollOffset + VISIBLE_COUNT < tasks.length && <Text color="gray">↓ More</Text>}
		</Box>
	);
};

export default TaskList;
