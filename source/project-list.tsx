import React from 'react';
import { Box, Text } from 'ink';
import { Project } from './types/project.types.js';

type ProjectListProps = {
	projects: Project[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const ProjectList = ({ projects, selectedIndex }: ProjectListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{projects.length === 0 && <Text>Loading...</Text>}
			{projects.map((project, index) => (
				<Text
					key={project.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{project.name}
				</Text>
			))}
		</Box>
	);
};

export default ProjectList;
