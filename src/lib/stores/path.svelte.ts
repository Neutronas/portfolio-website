import { browser } from '$app/environment';

export type Path = 'careers' | 'biography' | 'projects';

type AppState = {
	path: Path | null;
};

export const appState = $state<AppState>({ path: null });

function validPath(value: string): Path | null {
	return value === 'careers' || value === 'biography' || value === 'projects' ? value : null;
}

export function pickPath(p: Path) {
	if (browser) {
		window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	}
	appState.path = p;
	if (browser) {
		if (window.location.hash !== `#${p}`) {
			history.replaceState(null, '', `#${p}`);
		}
	}
}

export function resetPath() {
	if (browser) {
		window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
	}
	appState.path = null;
	if (browser) {
		history.replaceState(null, '', window.location.pathname + window.location.search);
	}
}

export function hydrateFromHash() {
	if (!browser) return;
	const h = window.location.hash.replace('#', '');
	const p = validPath(h);
	if (p) appState.path = p;
}

export function attachHashListener(): () => void {
	if (!browser) return () => {};
	const handler = () => {
		const h = window.location.hash.replace('#', '');
		const p = validPath(h);
		appState.path = p;
	};
	window.addEventListener('hashchange', handler);
	return () => window.removeEventListener('hashchange', handler);
}
