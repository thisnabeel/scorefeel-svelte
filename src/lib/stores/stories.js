import { writable } from 'svelte/store';
import API from '$lib/api/api';

export const stories = writable([]);
export const activeRole = writable('mentee');

export async function fetchStories() {
	try {
		const mentors = await API.get('/top_mentors');
		stories.set(mentors.slice(0, 3)); // Get first 3 mentors
	} catch (error) {
		console.error('Error fetching stories:', error);
		stories.set([]);
	}
}
