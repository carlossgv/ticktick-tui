import React, { useEffect, useState } from 'react';
import { Text, Box, } from 'ink';
import { fetchInboxTasks } from './api.js';

type Task = {
	id: string;
	title: string;
};

const TaskList = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchInboxTasks()
			.then((data) => {
				setTasks(data);
			})
			.catch((err) => {
				setError('Failed to fetch tasks');
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	if (loading) {
		return <Text>Loading tasks...</Text>;
	}

	if (error) {
		return <Text color="red">{error}</Text>;
	}

	if (tasks.length === 0) {
		return <Text color="gray">No tasks in inbox.</Text>;
	}

	return (
		<Box flexDirection="column">
			{tasks.map((task) => (
				<Text key={task.id}>• {task.title}</Text>
			))}
		</Box>
	);
};

export default TaskList;
