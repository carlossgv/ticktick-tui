import React from 'react';
import {Box, Text} from 'ink';
import {List} from '../types/list.types.js';
import {Spinner} from '@inkjs/ui';

type ProjectWithAmount = List & {
	amount: number;
};

type ProjectListProps = {
	projects: ProjectWithAmount[];
	selectedIndex: number;
	onSelect: (index: number) => void;
	isLoading: boolean;
};

const ProjectList = ({
	projects,
	selectedIndex,
	isLoading,
}: ProjectListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{isLoading && <Spinner label="Loading" />}
			{!isLoading && projects.length === 0 && (
				<Text color="gray">No projects</Text>
			)}
			{projects.map((project, index) => (
				<Text
					key={project.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{project.name} {project.amount > 0 ? `(${project.amount})` : ''}
				</Text>
			))}
		</Box>
	);
};

export default ProjectList;
