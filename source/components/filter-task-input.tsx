import React from 'react';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';

type Props = {
	value: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	isDisabled?: boolean;
	placeholder?: string;
};

const FilterTaskInput = ({
	value,
	onChange,
	onSubmit,
	isDisabled = false,
	placeholder = 'Type to filter...',
}: Props) => {
	return (
		<Box>
			<Text color="cyan">/</Text>
			<TextInput
				isDisabled={isDisabled}
				placeholder={placeholder}
				defaultValue={value}
				onChange={onChange}
				onSubmit={onSubmit}
			/>
		</Box>
	);
};

export default FilterTaskInput;
