import React, {useEffect, useState} from 'react';
import {Box, Newline, Text, useInput, useStdout} from 'ink';
import TaskList from './components/task-list.js';
import {TickTickClient} from './clients/ticktick.client.js';
import {Task} from './types/tasks.types.js';
import {List} from './types/list.types.js';
import ProjectList from './components/project-list.js';
import {convertStringToTaskBody} from './utils/text-parser.js';
import {DeleteTaskParams} from './types/ticktick.types.js';
import NewTaskInput from './components/new-task-input.js';

type AppProps = {
	client: TickTickClient;
}

const App = ({client}: AppProps) => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<List[]>([]);
	const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
	const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);
	const [selectedColumn, setSelectedColumn] = useState<number>(1); // 0 = left, 1 = center, 2 = right
	const [isAdding, setIsAdding] = useState(false);
	const [newTaskInput, setNewTaskInput] = useState('');
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const {stdout} = useStdout();
	const [terminalHeight, setTerminalHeight] = useState(stdout?.rows || 24);

	useEffect(() => {
		if (!stdout) return;

		const onResize = () => setTerminalHeight(stdout.rows);
		stdout.on('resize', onResize);

		return () => {
			stdout.off('resize', onResize);
		};
	}, [stdout]);

	useEffect(() => {
		const fetchData = async () => {
			await client.init();
			const fetchedProjects = await client.getLists();
			setProjects([
				{
					id: client.getInboxId(),
					name: 'Inbox',
				},
				...fetchedProjects,
			]);
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
			setTasks(
				selectedProject.isFilter
					? client?.getTasksByFilter(id) || []
					: client?.getTasksByProjectId(id) || [],
			);
			setSelectedTaskIndex(0);
		}
	};

	const selectedTask = tasks[selectedTaskIndex];

	useInput((input, key) => {
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

		if (showDeleteConfirmation) {
			if (input === 'y' || key.return) {
				handleDeleteTask();
				setShowDeleteConfirmation(false);
			} else if (input === 'n' || key.escape) {
				setShowDeleteConfirmation(false);
			}
			return;
		}

		if (input === 'n') {
			setIsAdding(true);
			setNewTaskInput('');
			return;
		}

		if (!isAdding && selectedColumn === 1 && input === 'd') {
			setShowDeleteConfirmation(true);
			return;
		}

		if (key.leftArrow || input === 'h') {
			setSelectedColumn(col => (col > 0 ? col - 1 : col));
		} else if (key.rightArrow || input === 'l') {
			setSelectedColumn(col => (col < 2 ? col + 1 : col));
		}

		if (selectedColumn === 0) {
			if (key.upArrow || input === 'k') {
				setSelectedProjectIndex(i => (i > 0 ? i - 1 : projects.length - 1));
			} else if (key.downArrow || input === 'j') {
				setSelectedProjectIndex(i => (i < projects.length - 1 ? i + 1 : 0));
			}
		} else if (selectedColumn === 1) {
			if (key.upArrow || input === 'k') {
				setSelectedTaskIndex(i => (i > 0 ? i - 1 : tasks.length - 1));
			} else if (key.downArrow || input === 'j') {
				setSelectedTaskIndex(i => (i < tasks.length - 1 ? i + 1 : 0));
			}
		}
	});

	const handleAddNewTask = async (text: string) => {
		const taskBody = convertStringToTaskBody(text);
		taskBody.projectId = projects[selectedProjectIndex]?.id;
		await client.addTasks([taskBody]);
		await client.refreshMainData();
		const project = projects[selectedProjectIndex];
		if (!project) return;
		setTasks(client.getTasksByProjectId(project.id) || []);
		setSelectedTaskIndex(0);
		setSelectedProjectIndex(projects.indexOf(project));
		setSelectedColumn(1);
	};

	const handleDeleteTask = async () => {
		const deleteTaskBody: DeleteTaskParams = {
			taskId: selectedTask?.id || '',
			projectId: projects[selectedProjectIndex]?.id || '',
		};

		await client.deleteTasks([deleteTaskBody]);
		await client.refreshMainData();
		const project = projects[selectedProjectIndex];
		if (!project) return;
		setTasks(client.getTasksByProjectId(project.id) || []);
		setSelectedTaskIndex(0);
		setSelectedProjectIndex(projects.indexOf(project));
		setSelectedColumn(1);
	};

	return (
		<Box flexDirection="column" width="100%" height="100%" flexGrow={1}>
			<Box flexDirection="row" width="100%" height="100%" flexGrow={1}>
				<Box
					width="25%"
					flexDirection="column"
					borderStyle="single"
					borderColor={selectedColumn === 0 ? 'green' : 'gray'}
				>
					<ProjectList
						projects={projects.map(p => {
							const amount = client.getTasksByProjectId(p.id).length || 0;
							return {...p, amount};
						})}
						selectedIndex={selectedProjectIndex}
						onSelect={setSelectedProjectIndex}
					/>
				</Box>

				<Box
					width="50%"
					flexDirection="column"
					borderStyle="single"
					borderColor={selectedColumn === 1 ? 'green' : 'gray'}
				>
					{isAdding && <NewTaskInput text={newTaskInput} />}
					<TaskList
						tasks={tasks}
						selectedIndex={selectedTaskIndex}
						onSelect={setSelectedTaskIndex}
						terminalHeight={terminalHeight}
					/>
					{showDeleteConfirmation && (
						<Box
							marginTop={1}
							padding={1}
							borderStyle="round"
							borderColor="red"
						>
							<Text>Delete task &quot;{selectedTask?.title}&quot;? (y/n)</Text>
						</Box>
					)}
				</Box>

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
			<Box
				width="100%"
				paddingX={1}
				paddingY={0}
				borderStyle="single"
				borderColor="gray"
			>
				<Text>arrows / hjkl: move | (n)ew task | (d)elete task </Text>
			</Box>
		</Box>
	);
};

export default App;
