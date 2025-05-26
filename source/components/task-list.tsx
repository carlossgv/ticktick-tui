import React, {useMemo, useRef, useEffect, useState} from 'react';
import {Box, Text, measureElement} from 'ink';
import {Spinner} from '@inkjs/ui';
import {DateTime} from 'luxon';
import {Task} from '../types/tasks.types.js';

type TaskListProps = {
	tasks: Task[];
	selectedIndex: number;
	onSelect: (index: number) => void;
	terminalHeight: number; // new prop
};

const TaskList = ({tasks, selectedIndex, terminalHeight}: TaskListProps) => {
	const visibleCount = Math.max(terminalHeight - 6, 1); // 2 for scroll indicators, 2 for padding

	function parseDate(task: Task): string {
		if (!task.startDate) return '';

		const timeZone = task.timeZone || 'America/Santiago';
		const localDate = DateTime.fromISO(task.startDate, {zone: 'utc'}).setZone(
			timeZone,
		);
		const nowLocal = DateTime.now().setZone(timeZone);

		const isToday =
			localDate.hasSame(nowLocal, 'day') &&
			localDate.hasSame(nowLocal, 'month') &&
			localDate.hasSame(nowLocal, 'year');

		if (task.isAllDay) return isToday ? '' : localDate.toFormat('MMM d');

		const isMidnight = localDate.hour === 0 && localDate.minute === 0;
		return isToday
			? isMidnight
				? ''
				: localDate.toFormat('HH:mm')
			: localDate.toFormat('MMM d');
	}

	const scrollOffset = useMemo(() => {
		if (selectedIndex < visibleCount) return 0;
		return selectedIndex - visibleCount + 1;
	}, [selectedIndex, visibleCount]);

	const visibleTasks = tasks.slice(scrollOffset, scrollOffset + visibleCount);

	return (
		<Box flexDirection="column">
			{tasks.length === 0 && <Spinner label="Loading" />}

			{scrollOffset > 0 && <Text color="gray">↑ More</Text>}

			{visibleTasks.map((task, index) => {
				const actualIndex = scrollOffset + index;
				const isSelected = actualIndex === selectedIndex;
				const isOverdue =
					task.startDate &&
					DateTime.fromISO(task.startDate).setZone(
						task.timeZone || 'America/Santiago',
					) < DateTime.now().setZone(task.timeZone || 'America/Santiago');

				return (
					<Box key={task.id} flexDirection="row" justifyContent="space-between">
						<Text
							color={isSelected ? 'black' : isOverdue ? 'red' : 'white'}
							backgroundColor={isSelected ? 'cyan' : undefined}
						>
							{task.title}
						</Text>
						<Box flexDirection="row">
							<Text color="yellow">
								{task.tags?.length ? ` #${task.tags.join(' #')}` : ''}
							</Text>
							<Text>{parseDate(task) ? ` (${parseDate(task)})` : ''}</Text>
						</Box>
					</Box>
				);
			})}

			{scrollOffset + visibleCount < tasks.length && (
				<Text color="gray">↓ More</Text>
			)}
		</Box>
	);
};

export default TaskList;
