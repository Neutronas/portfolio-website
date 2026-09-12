// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** Open menu panel on the home page (shallow routing). */
			panel?: string;
		}
		// interface Platform {}
	}
}

export {};
