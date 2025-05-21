// src/App.tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { fetchTasks } from './api.js'; // you'll implement this

type Task = {
	title: string;
	id: string;
};

const App: React.FC = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);

	React.useEffect(() => {
		(async () => {
			const fetchedTasks = await fetchTasks();
			setTasks(fetchedTasks);
		})();
	}, []);

	useInput((input, key) => {
		if (key.downArrow || input === 'j') {
			setSelectedIndex(i => Math.min(i + 1, tasks.length - 1));
		} else if (key.upArrow || input === 'k') {
			setSelectedIndex(i => Math.max(i - 1, 0));
		} else if (input === 'q') {
			process.exit(0);
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			{tasks.length === 0 && <Text>Loading...</Text>}
			{tasks.map((task, index) => (
				<Text
					key={task.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{task.title}
				</Text>
			))}
		</Box>
	);
};

export default App;
