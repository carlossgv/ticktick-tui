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
	TickTickProject,
	TickTickTask,
} from '../types/ticktick.types.js';
import { Project } from '../types/project.types.js';
import { Task } from '../types/tasks.types.js';

function getFilePath(filename: string): string {
	const home = os.homedir();
	if (!home) throw new Error('Unable to determine the home directory.');
	return path.join(home, filename);
}

export class TickTickClient {
	private cookieFile: string;
	private axiosInstance: AxiosInstance;
	private ticktickUrl: string = 'https://api.ticktick.com/api/v2';
	private xDeviceHeader: string = `{"platform":"web","os":"macOS 10.15.7","device":"Chrome 121.0.0.0","name":"","version":5070,"id":"65bcdf6491ea1a2e7db71fbe","channel":"website","campaign":"","websocket":""}`;
	private headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'x-device': this.xDeviceHeader,
	};
	private dataFilePath: string = '.ticktick_data';
	private inboxId: string | null = null;
	public mainData: TickTickMainResponse | null = null;

	constructor() {
		this.cookieFile = getFilePath(this.dataFilePath);
		this.axiosInstance = axios.create({
			headers: this.headers,
			withCredentials: true,
		});
	}

	public async init(): Promise<void> {
		this.mainData = await this.getMainData();
		this.inboxId = this.setInboxId();
	}

	private async getSessionCookies(): Promise<string[]> {
		const data = await fs.readFile(this.cookieFile, 'utf-8');
		return data.split(';').map(s => s.trim());
	}

	async login(username: string, password: string): Promise<void> {
		try {
			const body = { username, password };
			const response = await this.axiosInstance.post(
				`${this.ticktickUrl}/user/signon?wc=true&remember=true`,
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
			`${this.ticktickUrl}/batch/check/0`,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);
		console.log('User Info:', response.data);
		return response.data;
	}

	async refreshMainData(): Promise<void> {
		this.mainData = await this.getMainData();
		this.inboxId = this.setInboxId();
	}

	async getMainData(): Promise<TickTickMainResponse> {
		const cookies = await this.getSessionCookies();
		const response = await this.axiosInstance.get<TickTickMainResponse>(
			`${this.ticktickUrl}/batch/check/0`,
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

	getTasksByProjectId(projectId: string): Task[] {
		const tasks = this.mainData!.syncTaskBean.update.filter(
			task => task.projectId === projectId,
		);

		if (!Array.isArray(tasks)) {
			throw new Error('Invalid task data format');
		}

		return tasks.map(this.mapTickTickTaskToTask);
	}

	mapTickTickTaskToTask(tickTickTask: TickTickTask): Task {
		return {
			title: tickTickTask.title,
			id: tickTickTask.id,
			content: tickTickTask.content,
			tags: tickTickTask.tags,
		};
	}

	getInboxTasks(): Task[] {
		return this.getTasksByProjectId(this.inboxId!);
	}

	async fetchTasks(): Promise<TickTickTask[]> {
		const mainData = await this.getMainData();
		const tasks = mainData.syncTaskBean.update;

		if (!Array.isArray(tasks)) {
			throw new Error('Invalid task data format');
		}

		return tasks;
	}

	private setInboxId(): string {
		return this.mainData!.inboxId;
	}

	getInboxId(): string {
		if (!this.inboxId) {
			throw new Error('Inbox ID is not set. Call init() first.');
		}
		return this.inboxId;
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
			`${this.ticktickUrl}/batch/task`,
			body,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		console.log('Task operation result:', response.data);
	}

	private async fetchProjects(): Promise<TickTickProject[]> {
		const cookies = await this.getSessionCookies();
		const response = await this.axiosInstance.get<TickTickProject[]>(
			`${this.ticktickUrl}/projects`,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);
		return response.data;
	}

	async getProjects(): Promise<Project[]> {
		const projects = await this.fetchProjects();
		return projects.map(project => ({
			id: project.id,
			name: project.name,
		}));
	}
}
