import React from 'react';
import {Box, Text} from 'ink';
import {Project} from '../types/project.types.js';
import {Spinner} from '@inkjs/ui';

type ProjectWithAmount = Project & {
	amount: number;
};

type ProjectListProps = {
	projects: ProjectWithAmount[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const ProjectList = ({projects, selectedIndex}: ProjectListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{projects.length === 0 && <Spinner label="Loading" />}
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
