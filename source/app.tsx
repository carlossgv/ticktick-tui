import React, {useEffect, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TaskList from './task-list.js';
import {TickTickClient} from './api.js';
import {Task} from './types/tasks.types.js';

const App = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	useEffect(() => {
		const fetchData = async () => {
			const client = new TickTickClient();
			await client.init();
			const fetchedTasks = await client.getInboxTasks();
			setTasks(fetchedTasks);
		};

		fetchData().catch(console.error);
	}, []);

	const selectedTask = tasks[selectedIndex];

	useInput((input, key) => {
		if (key.upArrow || input === 'k') {
			setSelectedIndex(i => (i > 0 ? i - 1 : i));
		} else if (key.downArrow || input === 'j') {
			setSelectedIndex(i => (i < tasks.length - 1 ? i + 1 : i));
		}
	});

	return (
		<Box flexDirection="row" width="100%" padding={1} gap={1}>
			{/* Left column */}
			<Box
				width="25%"
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				<Text color="gray">Left Panel</Text>
			</Box>

			{/* Center column with tasks */}
			<Box
				width="50%"
				flexDirection="column"
				borderStyle="single"
				borderColor="cyan"
				padding={1}
			>
				<TaskList
					tasks={tasks}
					selectedIndex={selectedIndex}
					onSelect={setSelectedIndex}
				/>
			</Box>

			{/* Right column - task details */}
			<Box
				width="25%"
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				{selectedTask ? (
					<>
						<Text color="green">{selectedTask.title}</Text>
						{selectedTask.tags?.length > 0 && (
							<Text color="yellow">{`#${selectedTask.tags.join('# ')}`}</Text>
						)}
						<Text>{'\n'}</Text>
						<Text color="white">{selectedTask.content}</Text>
						{/* Add more fields like due date, description, etc. as needed */}
					</>
				) : (
					<Text color="gray">No task selected</Text>
				)}
			</Box>
		</Box>
	);
};

export default App;
