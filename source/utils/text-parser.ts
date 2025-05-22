import {TaskBody} from '../types/ticktick.types.js';

export const convertStringToTaskBody = (str: string): TaskBody => {
	const words = str.trim().split(/\s+/);
	const tags: string[] = [];
	const titleWords: string[] = [];

	for (const word of words) {
		if (word.startsWith('#') && word.length > 1) {
			tags.push(word.slice(1));
		} else {
			titleWords.push(word);
		}
	}

	return {
		title: titleWords.join(' '),
		tags: tags.length > 0 ? tags : undefined,
	};
};
