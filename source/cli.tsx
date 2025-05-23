#!/usr/bin/env node
import React from 'react';
import meow from 'meow';
import {render} from 'ink';
import App from './app.js';
import {convertStringToTaskBody} from './utils/text-parser.js';
import {TickTickClient} from './clients/ticktick.client.js';
import prompts from 'prompts';

const quickAddTask = async (text: string) => {
	try {
		const taskBody = convertStringToTaskBody(text);
		const client = new TickTickClient();
		await client.init();
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
	  $ ticktick-tui --login

	Options
	  --login, -l   Log into your TickTick account via email/password

	Examples
	  $ ticktick-tui "Buy milk #groceries"
	  $ ticktick-tui --login
`,
	{
		importMeta: import.meta,
		flags: {
			login: {
				type: 'boolean',
				alias: 'l',
			},
		},
	},
);

if (cli.flags.login) {
	const runLoginFlow = async () => {
		const response = await prompts([
			{
				type: 'text',
				name: 'email',
				message: 'Email:',
			},
			{
				type: 'password',
				name: 'password',
				message: 'Password:',
			},
		]);

		const client = new TickTickClient();
		try {
			await client.login(response.email, response.password);
			console.log('Login successful. Starting app...');
			render(<App />);
		} catch (err) {
			console.error('Login failed:', err);
			process.exit(1);
		}
	};

	await runLoginFlow();
} else if (cli.input.length > 0) {
	const quickAddText = cli.input.join(' ');
	await quickAddTask(quickAddText);
} else {
	render(<App />);
}
