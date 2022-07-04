import { writable } from 'svelte/store';

export const displayType = writable<'mobile' | 'desktop'>('desktop');
