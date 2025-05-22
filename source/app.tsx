import React, { useEffect, useState } from 'react';
import { Box, Newline, Text, useInput } from 'ink';
import TaskList from './components/task-list.js';
import { TickTickClient } from './clients/ticktick.client.js';
import { Task } from './types/tasks.types.js';
import { Project } from './types/project.types.js';
import ProjectList from './components/project-list.js';
import { convertStringToTaskBody } from './utils/text-parser.js';
import { Action } from './types/ticktick.types.js';
import NewTaskInput from './components/new-task-input.js';

const App = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
	const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);
	const [selectedColumn, setSelectedColumn] = useState<number>(1); // 0 = left, 1 = center, 2 = right
	const [client, setClient] = useState<TickTickClient | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [newTaskInput, setNewTaskInput] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			const client = new TickTickClient();
			await client.init();
			setClient(client);
			const fetchedProjects = await client.getProjects();
			setProjects([{
				id: client.getInboxId(),
				name: 'Inbox',
			}, ...fetchedProjects]);
			const fetchedTasks = client.getInboxTasks();
			setTasks(fetchedTasks);
		};

		fetchData().catch(console.error);
	}, []);

	useEffect(() => {
		if (projects.length > 0) {
			const selected = projects[selectedProjectIndex];
			if (selected) {
				handleProjectSelect(selected.id);
			}
		}
	}, [selectedProjectIndex]);

	const handleProjectSelect = (id: string) => {
		const selectedProject = projects.find(project => project.id === id);
		if (selectedProject) {
			setSelectedProjectIndex(projects.indexOf(selectedProject));
			setTasks(client?.getTasksByProjectId(id) || []);
			setSelectedTaskIndex(0);
		}
	};

	const selectedTask = tasks[selectedTaskIndex];

	useInput((input, key) => {
		// If adding a task, intercept key handling
		if (isAdding) {
			if (key.return) {
				if (newTaskInput.trim()) {
					handleAddNewTask(newTaskInput.trim());
				}
				setNewTaskInput('');
				setIsAdding(false);
				return;
			}
			if (key.escape) {
				setNewTaskInput('');
				setIsAdding(false);
				return;
			}
			if (key.delete || key.backspace) {
				setNewTaskInput(newTaskInput.slice(0, -1));
			} else {
				setNewTaskInput(newTaskInput + input);
			}
			return;
		}

		// Normal navigation
		if (input === 'n') {
			setIsAdding(true);
			setNewTaskInput('');
			return;
		}

		// Column navigation
		if (key.leftArrow || input === 'h') {
			setSelectedColumn(col => (col > 0 ? col - 1 : col));
		} else if (key.rightArrow || input === 'l') {
			setSelectedColumn(col => (col < 2 ? col + 1 : col));
		}

		// Navigation inside columns
		if (selectedColumn === 0) {
			if (key.upArrow || input === 'k') {
				setSelectedProjectIndex(i => (i > 0 ? i - 1 : i));
			} else if (key.downArrow || input === 'j') {
				setSelectedProjectIndex(i => (i < projects.length - 1 ? i + 1 : i));
			}
		} else if (selectedColumn === 1) {
			if (key.upArrow || input === 'k') {
				setSelectedTaskIndex(i => (i > 0 ? i - 1 : i));
			} else if (key.downArrow || input === 'j') {
				setSelectedTaskIndex(i => (i < tasks.length - 1 ? i + 1 : i));
			}
		}
	});

	const handleAddNewTask = async (text: string) => {
		const taskBody = convertStringToTaskBody(text);
		// TODO: implement logic to send to API and refresh tasks
		await client?.handleTasks([taskBody], Action.Add);
		await client?.refreshMainData();
		const project = projects[selectedProjectIndex];
		if (!project) return;
		setTasks(client?.getTasksByProjectId(project.id) || []);
		setSelectedTaskIndex(0);
		setSelectedProjectIndex(projects.indexOf(project));
		setSelectedColumn(1);
	};

	return (
		<Box flexDirection="row" width="100%" padding={1} gap={0}>
			{/* Left column */}
			<Box
				width="25%"
				flexDirection="column"
				borderStyle="single"
				borderColor={selectedColumn === 0 ? 'green' : 'gray'}
			>
				<ProjectList
					projects={projects.map(p => {
						const amount = client?.getTasksByProjectId(p.id).length || 0;
						return { ...p, amount };
					})}
					selectedIndex={selectedProjectIndex}
					onSelect={setSelectedProjectIndex}
				/>
			</Box>

			{/* Center column */}
			<Box
				width="50%"
				flexDirection="column"
				borderStyle="single"
				borderColor={selectedColumn === 1 ? 'green' : 'gray'}
			>


				{isAdding && (
					<NewTaskInput text={newTaskInput} />
				)}

				<TaskList
					tasks={tasks}
					selectedIndex={selectedTaskIndex}
					onSelect={setSelectedTaskIndex}
				/>
			</Box>

			{/* Right column */}
			<Box
				width="25%"
				flexDirection="column"
				borderStyle="single"
				borderColor={selectedColumn === 2 ? 'green' : 'gray'}
				padding={1}
			>
				{selectedTask ? (
					<>
						<Text color="green">{selectedTask.title}</Text>
						{selectedTask.tags?.length > 0 && (
							<Text color="yellow">{`#${selectedTask.tags.join('# ')}`}</Text>
						)}
						<Newline />
						<Text color="white">{selectedTask.content}</Text>
					</>
				) : (
					<Text color="gray">No task selected</Text>
				)}
			</Box>
		</Box>
	);
};

export default App;
