import React from 'react';
import {Box, Text} from 'ink';
import TaskList from './task-list.js';

const App = () => {
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
				<TaskList />
			</Box>

			{/* Right column */}
			<Box
				width="25%"
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				<Text color="gray">Right Panel</Text>
			</Box>
		</Box>
	);
};

export default App;
