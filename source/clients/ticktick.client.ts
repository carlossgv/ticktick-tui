import axios, {AxiosInstance} from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
	ErrorLoginResponse,
	HandleTasksBody,
	UpdateTaskParams,
	TaskOperationResponse,
	TickTickMainResponse,
	TickTickProject,
	TickTickTask,
	DeleteTaskParams,
	TickTickFilterRule,
	Condition,
} from '../types/ticktick.types.js';
import {List} from '../types/list.types.js';
import {now} from '../utils/text-parser.js';

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

	async getSessionCookies(): Promise<string[]> {
		try {
			const data = await fs.readFile(this.cookieFile, 'utf-8');
			return data.split(';').map(s => s.trim());
		} catch (err) {
			console.error(
				'Failed to read session cookies, usually means not logged in.',
			);
			throw err;
		}
	}

	async login(username: string, password: string): Promise<void> {
		try {
			const body = {username, password};
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

	async logout(): Promise<void> {
		try {
			await fs.unlink(this.cookieFile);
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				console.warn('No session found to log out.');
			} else {
				console.error('Failed to log out:', err);
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

	getTasksByProjectId(projectId: string): TickTickTask[] {
		const tasks = this.mainData!.syncTaskBean.update.filter(
			task => task.projectId === projectId,
		);

		if (!Array.isArray(tasks)) {
			throw new Error('Invalid task data format');
		}

		// Sort tasks in descending order of sortOrder
		const sortedTasks = tasks.sort((a, b) => a.sortOrder - b.sortOrder);

		return sortedTasks;
	}

	getInboxTasks(): TickTickTask[] {
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

	async deleteTasks(tasks: DeleteTaskParams[]): Promise<void> {
		const cookies = await this.getSessionCookies();

		const body: HandleTasksBody = {
			add: [],
			update: [],
			delete: tasks,
		};
		const response = await this.axiosInstance.post<TaskOperationResponse>(
			`${this.ticktickUrl}/batch/task`,
			body,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		if (!response.data || Object.keys(response.data.id2error).length > 0) {
			console.error(
				`Error in task operation: ${JSON.stringify(response.data.id2error)}`,
			);
		}
	}

	async completeTasks(tasks: UpdateTaskParams[]): Promise<void> {
		const completedTasks = tasks.map(task => ({
			...task,
			completedTime: now(),
			status: 2,
			// TODO: can it be another user?
			completedUserId: task.creator,
		}));

		await this.updateTasks(completedTasks);
	}

	async updateTasks(tasks: UpdateTaskParams[]): Promise<void> {
		const updatedTasks = tasks.map(task => ({
			...task,
			modifiedTime: now(),
		}));

		const body: HandleTasksBody = {
			add: [],
			update: updatedTasks,
			delete: [],
		};

		const cookies = await this.getSessionCookies();

		const response = await this.axiosInstance.post<TaskOperationResponse>(
			`${this.ticktickUrl}/batch/task`,
			body,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		if (!response.data || Object.keys(response.data.id2error).length > 0) {
			console.error(
				`Error in task operation: ${JSON.stringify(response.data.id2error)}`,
			);
		}
	}

	async addTasks(tasks: UpdateTaskParams[]): Promise<void> {
		const body: HandleTasksBody = {
			add: tasks,
			update: [],
			delete: [],
		};

		const cookies = await this.getSessionCookies();

		const response = await this.axiosInstance.post<TaskOperationResponse>(
			`${this.ticktickUrl}/batch/task`,
			body,
			{
				headers: {
					Cookie: cookies.join(';'),
				},
			},
		);

		if (!response.data || Object.keys(response.data.id2error).length > 0) {
			console.error(
				`Error in task operation: ${JSON.stringify(response.data.id2error)}`,
			);
		}
	}

	async fetchProjects(): Promise<TickTickProject[]> {
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

	async getLists(): Promise<List[]> {
		const projects = await this.fetchProjects();
		const filters = await this.getFilters();

		return [
			...filters.map(f => ({
				id: f.id,
				name: f.name,
				isFilter: true,
			})),
			...projects.map(p => ({
				id: p.id,
				name: p.name,
				isFilter: false,
			})),
		];
	}

	async getFilters(): Promise<List[]> {
		const filters = this.mainData!.filters.map(filter => ({
			id: filter.id,
			name: filter.name,
			isFilter: true,
		}));

		return filters;
	}

	private parseFilterRule(rule: string): TickTickFilterRule | null {
		try {
			return JSON.parse(rule);
		} catch (error) {
			console.error('Error parsing filter rule:', error);
		}

		return null;
	}

	private conditionMappers: Record<
		string,
		(task: TickTickTask, condition: Condition) => boolean
	> = {
		dueDate: (task, condition) => {
			const hasDueDate = !!task.dueDate;
			return condition.not.includes('nodue') ? hasDueDate : !hasDueDate;
		},

		listOrGroup: (task, condition) => {
			for (const notCond of condition.not) {
				if (typeof notCond === 'object' && 'or' in notCond) {
					if (notCond.conditionName === 'list') {
						// If task's projectId is in the excluded list
						if (notCond.or.includes(task.projectId)) return false;
					}
				}
			}
			return true;
		},
	};

	// Main filter method
	getTasksByFilter(filterId: string): TickTickTask[] {
		const tasks = this.mainData!.syncTaskBean.update;
		const filter = this.mainData!.filters.find(f => f.id === filterId);

		if (!filter) {
			console.error('Filter not found');
			return [];
		}

		if (!filter.rule) {
			return tasks;
		}

		const rule = this.parseFilterRule(filter?.rule);

		if (!rule) {
			console.error('Invalid filter rule');
			return tasks;
		}

		return tasks.filter(task => {
			return rule.and.every(condition => {
				const mapper = this.conditionMappers[condition.conditionName];
				if (!mapper) return true; // If unknown condition, ignore it
				return mapper(task, condition);
			});
		});
	}
}
