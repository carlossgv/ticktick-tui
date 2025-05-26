import React from 'react';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';

type Filter = {
	id: string;
	name: string;
	amount?: number;
};

type FiltersListProps = {
	filters: Filter[];
	selectedIndex: number;
	onSelect: (index: number) => void;
};

const FiltersList = ({filters, selectedIndex, onSelect}: FiltersListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{filters.length === 0 && <Spinner label="Loading" />}
			{filters.map((filter, index) => (
				<Text
					key={filter.id}
					color={index === selectedIndex ? 'black' : undefined}
					backgroundColor={index === selectedIndex ? 'cyan' : undefined}
				>
					{filter.name} {filter.amount ? `(${filter.amount})` : ''}
				</Text>
			))}
		</Box>
	);
};

export default FiltersList;
