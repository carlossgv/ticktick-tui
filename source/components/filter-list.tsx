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
	isLoading: boolean;
};

const FiltersList = ({
	filters,
	selectedIndex,
	onSelect,
	isLoading,
}: FiltersListProps) => {
	return (
		<Box flexDirection="column" padding={1}>
			{isLoading && <Spinner label="Loading" />}
			{!isLoading && filters.length === 0 && (
				<Text color="gray">No filters</Text>
			)}
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
