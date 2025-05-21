import axios from 'axios';
import { Task } from './types/tasks.types.js';

// Dummy function for now, to be implemented later with real endpoint
export const fetchTasks = async (): Promise<Task[]> => {
	return [{
		id: '1',
		title: 'Sample Task 1',
	}, {
		id: '2',
		title: 'Sample Task 2',
	}]
	// Replace with real API URL and headers later
	const response = await axios.get('https://api.ticktick.com/mock/inbox', {
		headers: {
			Authorization: 'Bearer YOUR_TOKEN_HERE',
		},
	});

	// Map or transform the response if needed
	return response.data.tasks || [];
};
