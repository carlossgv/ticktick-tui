import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

type Props = {
	text: string;
};

const NewTaskInput = ({ text }: Props) => {
	const [showCursor, setShowCursor] = useState(true);

	useEffect(() => {
		const timer = setInterval(() => {
			setShowCursor(prev => !prev);
		}, 500); // Blink every 500ms
		return () => clearInterval(timer);
	}, []);

	return (
		<Box marginBottom={1} borderStyle="single" borderColor="green">
			<Text color="cyan">➤ </Text>
			<Text color="white">
				{text}
				{showCursor && <Text color="gray">|</Text>}
			</Text>
		</Box>
	);
};

export default NewTaskInput;
