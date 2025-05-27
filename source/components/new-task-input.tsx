import React from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";

type Props = {
	onSubmit?: (value: string) => void;
};

const NewTaskInput = ({ onSubmit }: Props) => {
	const [value, setValue] = React.useState("");
	return (
		<Box borderStyle="single" borderColor="green" marginBottom={1} paddingX={1}>
			<Text color="cyan">➤ </Text>
			<TextInput
				onChange={setValue}
				onSubmit={() => {
					if (onSubmit) onSubmit(value.trim());
					setValue("");
				}}
				placeholder="Type new task..."
			/>
		</Box>
	);
};

export default NewTaskInput;
