#!/usr/bin/env node
import React from 'react';
import meow from 'meow';
import {render} from 'ink';
import App from './app.js';
import {convertStringToTaskBody} from './utils/text-parser.js';
import {TickTickClient} from './clients/ticktick.client.js';

// Mock quick add handler
const quickAddTask = async (text: string) => {
	try {
		// Simulate async task creation
		const taskBody = convertStringToTaskBody(text);
		const client = new TickTickClient();
		client.init();
		await client.addTasks([taskBody]);
		console.log('Task added successfully');
		process.exit(0);
	} catch (err) {
		console.error('Failed to add task:', err);
		process.exit(1);
	}
};

const cli = meow(
	`
	Usage
	  $ ticktick-tui ["task to add"]

	Examples
	  $ ticktick-tui "Buy milk #groceries"
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

// If there's a quoted input, call the quick add logic and exit
const quickAddText = cli.input.length > 0 ? cli.input.join(' ') : undefined;

if (quickAddText) {
	await quickAddTask(quickAddText);
} else {
	render(<App />);
}
