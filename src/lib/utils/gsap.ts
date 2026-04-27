// Lazy GSAP loader — keeps the initial bundle lean. Call from onMount / $effect.

let gsapPromise: Promise<typeof import('gsap').gsap> | null = null;

export function loadGsap() {
	if (!gsapPromise) {
		gsapPromise = (async () => {
			const gsapMod = await import('gsap');
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');
			gsapMod.gsap.registerPlugin(ScrollTrigger);
			return gsapMod.gsap;
		})();
	}
	return gsapPromise;
}

export async function loadScrollTrigger() {
	await loadGsap();
	const { ScrollTrigger } = await import('gsap/ScrollTrigger');
	return ScrollTrigger;
}

export function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}
