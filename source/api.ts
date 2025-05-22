import axios, { AxiosInstance } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
	Action,
	ErrorLoginResponse,
	HandleTasksBody,
	TaskBody,
	TickTickMainResponse,
	TickTickTask,
} from './types/ticktick.types.js';
import { Task } from './types/tasks.types.js';

const TICKTICK_URL = 'https://api.ticktick.com/api/v2';
const X_DEVICE_HEADER = `{"platform":"web","os":"macOS 10.15.7","device":"Chrome 121.0.0.0","name":"","version":5070,"id":"65bcdf6491ea1a2e7db71fbe","channel":"website","campaign":"","websocket":""}`;
const DATA_FILE_PATH = '.ticktick_data';

function getFilePath(filename: string): string {
	const home = os.homedir();
	if (!home) throw new Error('Unable to determine the home directory.');
	return path.join(home, filename);
}

export class TickTickClient {
	private cookieFile: string;
	private axiosInstance: AxiosInstance;
	private ticktickUrl: string = TICKTICK_URL;
	private xDeviceHeader: string = X_DEVICE_HEADER;
	private headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'x-device': X_DEVICE_HEADER,
	};
	private dataFilePath: string = DATA_FILE_PATH;
	public inboxId: string | null = null;

	constructor() {
		this.cookieFile = getFilePath(this.dataFilePath);
		this.axiosInstance = axios.create({
			headers: this.headers,
			withCredentials: true,
		});
	}

	public async init(): Promise<void> {
		this.inboxId = await this.getInboxId();
	}

	private async getSessionCookies(): Promise<string[]> {
		const data = await fs.readFile(this.cookieFile, 'utf-8');
		return data.split(';').map(s => s.trim());
	}

	async login(username: string, password: string): Promise<void> {
		try {
			const body = { username, password };
			const response = await this.axiosInstance.post(
				`${TICKTICK_URL}/user/signon?wc=true&remember=true`,
				body,
			);

			const cookies = response.headers['set-cookie'] || [];
			await fs.writeFile(this.cookieFile, cookies.join(';'));
			console.log('Login successful!');
		} catch (err: any) {
			if (err.response?.data) {
				const error = err.response.data as ErrorLoginResponse;
				console.error(
					`Login failed! Code: ${error.errorCode}, Message: ${error.errorMessage}, ID: ${error.errorId}`,
				);
				console.error(`Remainder times: ${error.data.remainderTimes}`);
			} else {
				throw err;
			}
		}
	}

	async getUserInfo(): Promise<any> {
		const cookies = await this.getSessionCookies();
		const response = await this.axiosInstance.get(
			`${TICKTICK_URL}/batch/check/0`,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);
		console.log('User Info:', response.data);
		return response.data;
	}

	async getMainData(): Promise<TickTickMainResponse> {
		const cookies = await this.getSessionCookies();
		const response = await this.axiosInstance.get<TickTickMainResponse>(
			`${TICKTICK_URL}/batch/check/0`,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		if (!response.data.inboxId || typeof response.data.inboxId !== 'string') {
			throw new Error('Inbox ID is missing or invalid in response.');
		}

		return response.data;
	}

	async fetchTasksByProjectId(projectId: string): Promise<TickTickTask[]> {
		const mainData = await this.getMainData();
		const tasks = mainData.syncTaskBean.update.filter(
			task => task.projectId === projectId,
		);

		if (!Array.isArray(tasks)) {
			throw new Error('Invalid task data format');
		}

		return tasks
	}

	mapTickTickTaskToTask(tickTickTask: TickTickTask): Task {
		return {
			title: tickTickTask.title,
			id: tickTickTask.id,
			content: tickTickTask.content,
			tags: tickTickTask.tags,
		};
	}

	async getInboxTasks(): Promise<Task[]> {
		if (!this.inboxId) {
			this.inboxId = await this.getInboxId();
		}

		const tasks = await this.fetchTasksByProjectId(this.inboxId);

		return tasks.map(this.mapTickTickTaskToTask);
	}

	async fetchTasks(): Promise<TickTickTask[]> {
		const mainData = await this.getMainData();
		const tasks = mainData.syncTaskBean.update;

		if (!Array.isArray(tasks)) {
			throw new Error('Invalid task data format');
		}

		return tasks;
	}

	async getInboxId(): Promise<string> {
		const mainData = await this.getMainData();
		if (!mainData.inboxId) {
			throw new Error('Inbox ID is missing in response');
		}
		return mainData.inboxId;
	}

	async handleTasks(tasksList: TaskBody[], action: Action): Promise<void> {
		if (action === Action.Update && tasksList.some(t => !t.id)) {
			throw new Error('Task ID is required for updates');
		}

		const body: HandleTasksBody = {
			add: [],
			update: [],
			delete: [],
		};

		body[action] = tasksList;
		const cookies = await this.getSessionCookies();

		const response = await this.axiosInstance.post(
			`${TICKTICK_URL}/batch/task`,
			body,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		console.log('Task operation result:', response.data);
	}
}
