import React from 'react';
import { Text } from 'ink';

type Props = {
	name: string | undefined;
};

import { Box } from 'ink';
import TaskList from './task-list.js';

const App = () => {
	return (
		<Box flexDirection="row">
			{/* Left column (empty for now) */}
			<Box width="25%"></Box>

			{/* Center column */}
			<Box width="50%" flexDirection="column">
				<TaskList />
			</Box>

			{/* Right column (empty for now) */}
			<Box width="25%"></Box>
		</Box>
	);
};

export default App;
