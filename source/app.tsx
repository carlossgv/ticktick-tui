import React, {useEffect, useState} from 'react';
import {Box, Newline, Text, useInput, useStdout} from 'ink';
import TaskList from './components/task-list.js';
import {TickTickClient} from './clients/ticktick.client.js';
import {List} from './types/list.types.js';
import ProjectList from './components/project-list.js';
import {convertStringToTaskBody} from './utils/text-parser.js';
import {DeleteTaskParams, TickTickTask} from './types/ticktick.types.js';
import NewTaskInput from './components/new-task-input.js';
import FilterTaskInput from './components/filter-task-input.js';

type AppProps = {
	client: TickTickClient;
};

type SortType = 'default' | 'date' | 'title';

const sortTypes: SortType[] = ['default', 'date', 'title'];

const getSortedTasks = (
	tasks: TickTickTask[],
	sortType: SortType,
	reversed: boolean,
): TickTickTask[] => {
	const sorted = [...tasks];
	switch (sortType) {
		case 'date':
			sorted.sort((a, b) => {
				const ad = new Date(a.startDate || 0).getTime();
				const bd = new Date(b.startDate || 0).getTime();
				return ad - bd;
			});
			break;
		case 'title':
			sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
			break;
		case 'default':
		default:
			// No extra sorting, keep original order
			break;
	}
	if (reversed) sorted.reverse();
	return sorted;
};

const App = ({client}: AppProps) => {
	const [loading, setLoading] = useState(true);
	const [tasks, setTasks] = useState<TickTickTask[]>([]);
	const [allTasks, setAllTasks] = useState<TickTickTask[]>([]);
	const [sortedTasks, setSortedTasks] = useState<TickTickTask[]>([]);
	const [projects, setProjects] = useState<List[]>([]);
	const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
	const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);
	const [selectedColumn, setSelectedColumn] = useState<number>(1); // 0 = left, 1 = center, 2 = right
	const [isAdding, setIsAdding] = useState(false);
	const [newTaskInput, setNewTaskInput] = useState('');
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [showCompleteConfirmation, setShowCompleteConfirmation] =
		useState(false);
	const {stdout} = useStdout();
	const [terminalHeight, setTerminalHeight] = useState(stdout?.rows || 24);
	const [sortType, setSortType] = useState<SortType>('default');
	const [sortReversed, setSortReversed] = useState<boolean>(false);

	// Filter state
	const [isFiltering, setIsFiltering] = useState(false);
	const [filterValue, setFilterValue] = useState('');
	const [filterActive, setFilterActive] = useState(false);

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
			setAllTasks(fetchedTasks);
			setTasks(fetchedTasks);
			setLoading(false);
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

	useEffect(() => {
		// Filtering logic
		let toSort = tasks;
		if ((isFiltering || filterActive) && filterValue.trim() !== '') {
			const value = filterValue.toLowerCase();
			toSort = tasks.filter(
				task =>
					(task.title && task.title.toLowerCase().includes(value)) ||
					(task.content && task.content.toLowerCase().includes(value)) ||
					(task.tags &&
						task.tags.some(tag => tag.toLowerCase().includes(value))),
			);
		}
		setSortedTasks(getSortedTasks(toSort, sortType, sortReversed));
		setSelectedTaskIndex(i => Math.min(i, toSort.length - 1));
	}, [tasks, sortType, sortReversed, filterActive, filterValue, isFiltering]);

	const handleProjectSelect = (id: string) => {
		const selectedProject = projects.find(project => project.id === id);
		if (selectedProject) {
			setSelectedProjectIndex(projects.indexOf(selectedProject));
			const projectTasks = selectedProject.isFilter
				? client?.getTasksByFilter(id) || []
				: client?.getTasksByProjectId(id) || [];
			setAllTasks(projectTasks);
			setTasks(projectTasks);
			setSelectedTaskIndex(0);
			setFilterActive(false); // reset filter on project switch
			setFilterValue('');
		}
	};

	const selectedTask = sortedTasks[selectedTaskIndex];

	useInput((input, key) => {
		// Filtering mode: live update filterValue and the filtered list
		if (isFiltering) {
			if (key.return) {
				setIsFiltering(false);
				setFilterActive(true);
				setSelectedColumn(1); // move to tasks
				return;
			}
			if (key.escape) {
				setIsFiltering(false);
				setFilterValue('');
				setFilterActive(false);
				setTasks(allTasks); // reset tasks to original for project
				return;
			}
			if (key.delete || key.backspace) {
				setFilterValue(val => val.slice(0, -1));
			} else if (input.length === 1) {
				setFilterValue(val => val + input);
			}
			return;
		}

		// When filter is active and not editing, allow esc and / to operate as described
		if (filterActive) {
			if (key.escape) {
				setFilterActive(false);
				setFilterValue('');
				setTasks(allTasks);
				return;
			}
			if (input === '/') {
				setIsFiltering(true);
				// keep filterValue as is
				return;
			}
		}

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

		if (showCompleteConfirmation) {
			if (input === 'y' || key.return) {
				handleCompleteTask();
				setShowCompleteConfirmation(false);
			} else {
				setShowCompleteConfirmation(false);
			}
			return;
		}

		if (input === '/') {
			setIsFiltering(true);
			// keep filterValue as is
			setFilterActive(false); // entering filter mode, not active yet
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

		// Mark complete confirmation
		if (!isAdding && selectedColumn === 1 && key.return) {
			setShowCompleteConfirmation(true);
			return;
		}

		// Sorting keybindings
		if (!isAdding && selectedColumn === 1) {
			if (input === 's') {
				setSortType(curr => {
					const idx = sortTypes.indexOf(curr);
					if (idx === -1) return 'default';
					const nextType = sortTypes[(idx + 1) % sortTypes.length];
					return nextType ? nextType : 'default';
				});
				setSelectedTaskIndex(0); // reset selection
				return;
			}
			if (input === 'r') {
				setSortReversed(r => !r);
				return;
			}
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
				setSelectedTaskIndex(i => (i > 0 ? i - 1 : sortedTasks.length - 1));
			} else if (key.downArrow || input === 'j') {
				setSelectedTaskIndex(i => (i < sortedTasks.length - 1 ? i + 1 : 0));
			}
		}
	});

	const handleAddNewTask = async (text: string) => {
		const taskBody = await convertStringToTaskBody(text, client);
		taskBody.projectId =
			taskBody.projectId ?? projects[selectedProjectIndex]?.id;

		await client.addTasks([taskBody]);
		await client.refreshMainData();
		const project = projects[selectedProjectIndex];
		if (!project) return;
		const projectTasks = client.getTasksByProjectId(project.id) || [];
		setAllTasks(projectTasks);
		setTasks(projectTasks);
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
		const projectTasks = client.getTasksByProjectId(project.id) || [];
		setAllTasks(projectTasks);
		setTasks(projectTasks);
		setSelectedTaskIndex(0);
		setSelectedProjectIndex(projects.indexOf(project));
		setSelectedColumn(1);
	};

	const handleCompleteTask = async () => {
		if (!selectedTask) return;
		await client.completeTasks([selectedTask]);
		await client.refreshMainData();
		const project = projects[selectedProjectIndex];
		if (!project) return;
		const projectTasks = client.getTasksByProjectId(project.id) || [];
		setAllTasks(projectTasks);
		setTasks(projectTasks);
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
					borderStyle={selectedColumn === 0 ? 'bold' : 'single'}
					borderColor={selectedColumn === 0 ? 'green' : 'gray'}
				>
					<ProjectList
						projects={projects.map(p => {
							const amount = client.getTasksByProjectId(p.id).length || 0;
							return {...p, amount};
						})}
						selectedIndex={selectedProjectIndex}
						onSelect={setSelectedProjectIndex}
						isLoading={loading}
					/>
				</Box>

				<Box
					width="50%"
					flexDirection="column"
					borderStyle={selectedColumn === 1 ? 'bold' : 'single'}
					borderColor={selectedColumn === 1 ? 'green' : 'gray'}
					padding={1}
				>
					<Box
						flexDirection="row"
						justifyContent="space-between"
						marginBottom={1}
					>
						<Text color="green">{projects[selectedProjectIndex]?.name}</Text>
						<Text color="gray">{` (sorted by: ${sortType} ${sortReversed ? '↑' : '↓'})`}</Text>
					</Box>
{isFiltering ? (
	<FilterTaskInput
		value={filterValue}
		onChange={setFilterValue}
		onSubmit={() => {
			setIsFiltering(false);
			setFilterActive(true);
			setSelectedColumn(1); // move to tasks
		}}
		isDisabled={false}
	/>
) : filterActive && filterValue.trim() !== '' ? (
	<Box>
		<Text color="cyan">/{filterValue}</Text>
		<Text color="gray">{' (press / to edit, Esc to clear)'}</Text>
	</Box>
) : null}
{isAdding && (
	<NewTaskInput
		text={newTaskInput}
		onChange={setNewTaskInput}
	/>
)}
					<TaskList
						tasks={sortedTasks}
						selectedIndex={selectedTaskIndex}
						onSelect={setSelectedTaskIndex}
						terminalHeight={terminalHeight}
						isLoading={loading}
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
					{showCompleteConfirmation && (
						<Box
							marginTop={1}
							padding={1}
							borderStyle="round"
							borderColor="green"
						>
							<Text>
								Mark task &quot;{selectedTask?.title}&quot; as completed?
								(y/Enter = yes, any other key = cancel)
							</Text>
						</Box>
					)}
				</Box>

				<Box
					width="25%"
					flexDirection="column"
					borderStyle={selectedColumn === 2 ? 'bold' : 'single'}
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
				flexDirection="column"
			>
				<Text>
					arrows / hjkl: move | /: filter | (n)ew task | (d)elete task | (Enter)
					complete task | (s)ort: {sortType} | (r)everse sort
				</Text>
			</Box>
		</Box>
	);
};

export default App;
