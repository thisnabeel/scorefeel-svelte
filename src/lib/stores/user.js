import storage from '$lib/stores/storage';
import { readable, writable } from 'svelte/store';

export const user = storage('user', null);
export const admin = storage('admin', false);
export const userView = writable('mentor');
