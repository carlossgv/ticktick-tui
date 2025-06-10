#!/usr/bin/env node
import React from 'react';
import meow from 'meow';
import App from './app.js';
import { convertStringToTaskBody } from './utils/text-parser.js';
import { TickTickClient } from './clients/ticktick.client.js';
import prompts from 'prompts';
import { withFullScreen } from 'fullscreen-ink';

const quickAddTask = async (text: string) => {
	try {
		const client = new TickTickClient();
		await client.init();

		const taskBody = await convertStringToTaskBody(text, client);

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
	  $ ticktick-tui --logout

	Options
	  --login, -l     Log into your TickTick account via email/password
	  --logout        Log out and remove session cookies

	Examples
	  $ ticktick-tui "Buy milk #groceries"
	  $ ticktick-tui --login
	  $ ticktick-tui --logout
`,
	{
		importMeta: import.meta,
		flags: {
			login: {
				type: 'boolean',
				alias: 'l',
			},
			logout: {
				type: 'boolean',
			},
			help: {
				type: 'boolean',
				alias: 'h',
			},
		},
	},
);

if (cli.flags.logout) {
	const client = new TickTickClient();
	try {
		await client.logout();
		console.log('Logged out successfully.');
		process.exit(0);
	} catch (err) {
		console.error('Failed to log out:', err);
		process.exit(1);
	}
} else if (cli.flags.login) {
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
			withFullScreen(<App client={client} />).start();
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
	const client = new TickTickClient();
	const cookies = await client.getSessionCookies();

	if (!cookies || cookies.length === 0) {
		console.error('You are not logged in. Please run with --login to log in.');
		process.exit(1);
	}

	withFullScreen(<App client={client} />).start();
}
