// Lazy Leaflet loader. CSS is imported alongside the module so tile layouts work.

let leafletPromise: Promise<typeof import('leaflet')> | null = null;

export function loadLeaflet() {
	if (!leafletPromise) {
		leafletPromise = (async () => {
			const [L] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
			return L;
		})();
	}
	return leafletPromise;
}

export const CARTO_POSITRON_URL =
	'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const CARTO_ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
