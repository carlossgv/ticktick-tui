import React from 'react';
import { Box, Text } from 'ink';
import { Task } from '../types/tasks.types.js';

type TaskListProps = {
	tasks: Task[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const TaskList = ({ tasks, selectedIndex }: TaskListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{tasks.length === 0 && <Text>Loading...</Text>}
			{tasks.map((task, index) => (
				<Text
					key={task.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{task.title} {task.tags?.length ? `#${task.tags.join('# ')}` : ''}
				</Text>
			))}
		</Box>
	);
};

export default TaskList;
