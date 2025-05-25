import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Box, Text, measureElement } from 'ink';
import { Spinner } from '@inkjs/ui';
import { DateTime } from 'luxon';
import { Task } from '../types/tasks.types.js';

type TaskListProps = {
	tasks: Task[];
	selectedIndex: number;
	onSelect: (index: number) => void;
	terminalHeight: number; // new prop
};

const TaskList = ({ tasks, selectedIndex, terminalHeight }: TaskListProps) => {
	const visibleCount = Math.max(terminalHeight - 6, 1); // 2 for scroll indicators, 2 for padding

	function parseDate(task: Task): string {
		if (!task.startDate) return '';

		const timeZone = task.timeZone || 'America/Santiago';
		const localDate = DateTime.fromISO(task.startDate, { zone: 'utc' }).setZone(timeZone);
		const nowLocal = DateTime.now().setZone(timeZone);

		const isToday =
			localDate.hasSame(nowLocal, 'day') &&
			localDate.hasSame(nowLocal, 'month') &&
			localDate.hasSame(nowLocal, 'year');

		if (task.isAllDay) return isToday ? '' : localDate.toFormat('MMM d');

		const isMidnight = localDate.hour === 0 && localDate.minute === 0;
		return isToday ? (isMidnight ? '' : localDate.toFormat('HH:mm')) : localDate.toFormat('MMM d');
	}

	const scrollOffset = useMemo(() => {
		if (selectedIndex < visibleCount) return 0;
		return selectedIndex - visibleCount + 1;
	}, [selectedIndex, visibleCount]);

	const visibleTasks = tasks.slice(scrollOffset, scrollOffset + visibleCount);

	return (
		<Box flexDirection="column" padding={1}>
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

			{scrollOffset + visibleCount < tasks.length && <Text color="gray">↓ More</Text>}
		</Box>
	);
};

export default TaskList;
