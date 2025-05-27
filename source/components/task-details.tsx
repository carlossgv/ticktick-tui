import React, { useState } from "react";
import { Text, Newline, Box, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { Task } from "../types/tasks.types.js";

type TaskDetailsProps = {
	task?: Task;
	onUpdate?: (task: Task) => void;
};

const fields = ["title", "tags", "content"] as const;
type Field = typeof fields[number];

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onUpdate }) => {
	const [editMode, setEditMode] = useState(false);
	const [editTask, setEditTask] = useState<Task | undefined>(undefined);
	const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);

	const currentField: Field = fields[currentFieldIndex] || "title";

	// Start edit mode and clone the current task
	const startEdit = () => {
		if (task) {
			setEditTask({ ...task });
			setEditMode(true);
			setCurrentFieldIndex(0);
		}
	};

	const cancelEdit = () => {
		setEditMode(false);
		setEditTask(undefined);
	};

	const saveEdit = () => {
		if (onUpdate && editTask) {
			onUpdate(editTask);
		}
		setEditMode(false);
		setEditTask(undefined);
	};

	useInput((input, key) => {
		if (!task) return;
		if (!editMode && input === "e") {
			startEdit();
		} else if (editMode) {
			if (key.escape) {
				cancelEdit();
			} else if (key.return) {
				if (currentFieldIndex === fields.length - 1) {
					saveEdit();
				} else {
					setCurrentFieldIndex((i) => Math.min(i + 1, fields.length - 1));
				}
			} else if (key.tab) {
				setCurrentFieldIndex((i) => (i + 1) % fields.length);
			} else if (key.shift && key.tab) {
				setCurrentFieldIndex((i) => (i - 1 + fields.length) % fields.length);
			}
		}
	});

	if (!task) {
		return <Text color="gray">No task selected</Text>;
	}

	if (!editMode) {
		return (
			<>
				<Text color="green">{task.title}</Text>
				{task.tags && task.tags.length > 0 && (
					<Text color="yellow">{`#${task.tags.join(" #")}`}</Text>
				)}
				<Newline />
				<Text color="white">{task.content}</Text>
				<Newline />
				<Text color="gray">Press (e) to edit</Text>
			</>
		);
	}

	// Edit mode rendering
	return (
		<Box flexDirection="column">
			<Box>
				<Text color={currentField === "title" ? "cyan" : "green"}>Title: </Text>
				{currentField === "title" ? (
					<TextInput
						// value={editTask?.title ?? ""}
						onChange={(value) =>
							setEditTask((t) => (t ? { ...t, title: value } : t))
						}
					/>
				) : (
					<Text>{editTask?.title}</Text>
				)}
			</Box>
			<Box>
				<Text color={currentField === "tags" ? "cyan" : "yellow"}>Tags: </Text>
				{currentField === "tags" ? (
					<TextInput
						// value={
						// 	Array.isArray(editTask?.tags)
						// 		? editTask.tags.join(" ")
						// 		: typeof editTask?.tags === "string"
						// 			? editTask.tags
						// 			: ""
						// }
						onChange={(value) => {
							if (editTask) {
								setEditTask({ ...editTask, tags: value.split(" ").filter(Boolean) })
							}
						}}
						placeholder="e.g. work urgent"
					/>
				) : (
					<Text>
						{Array.isArray(editTask?.tags)
							? editTask?.tags.join(" ")
							: editTask?.tags}
					</Text>
				)}
			</Box>
			<Box>
				<Text color={currentField === "content" ? "cyan" : "white"}>
					Content:{" "}
				</Text>
				{currentField === "content" ? (
					<TextInput
						// // value={editTask?.content ?? ""}
						// onChange={(value) =>
						// 	setEditTask((t) => (t ? { ...t, content: value } : t))
						// }
						placeholder="Task details..."
					/>
				) : (
					<Text>{editTask?.content}</Text>
				)}
			</Box>
			<Newline />
			<Box>
				<Text color="gray">
					Tab/Enter: next, Esc: cancel, Enter (last field): save
				</Text>
			</Box>
		</Box>
	);
};

export default TaskDetails;
