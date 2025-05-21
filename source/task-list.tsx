// src/App.tsx
import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {TickTickClient} from './api.js'; // you'll implement this
import {Task} from './types/tasks.types.js';

const App: React.FC = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);

	React.useEffect(() => {
		(async () => {
			const client = new TickTickClient();
			await client.init();
			setTasks(await client.getInboxTasks());
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
			{tasks.map((task, index) => {
				const tags = task.tags?.length ? ` #${task.tags.join(' #')}` : '';
				return (
					<Text
						key={task.id}
						color={index === selectedIndex ? 'black' : undefined}
						backgroundColor={index === selectedIndex ? 'cyan' : undefined}
					>
						{task.title}
						{tags}
					</Text>
				);
			})}
		</Box>
	);
};

export default App;
