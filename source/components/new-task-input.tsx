import React from 'react';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';

type Props = {
	text: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	isDisabled?: boolean;
	placeholder?: string;
};

const NewTaskInput = ({
	text,
	onChange,
	onSubmit,
	isDisabled = false,
	placeholder = 'Type your new task...',
}: Props) => {
	return (
		<Box borderStyle="single" borderColor="green" marginBottom={1} paddingX={1}>
			<Text color="cyan">➤ </Text>
			<TextInput
				isDisabled={isDisabled}
				placeholder={placeholder}
				defaultValue={text}
				onChange={onChange}
				onSubmit={onSubmit}
			/>
		</Box>
	);
};

export default NewTaskInput;
