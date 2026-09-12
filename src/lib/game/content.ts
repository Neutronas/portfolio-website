import contacts from '$lib/data/contacts.json';
import careers from '$lib/data/careers.json';
import projectsData from '$lib/data/projects.json';
import biographyData from '$lib/data/biography.json';
import type { Preview } from '$lib/scene/screens';

export type ItemId = 'career' | 'projects' | 'biography' | 'resume' | 'github' | 'linkedin' | 'contact';
export type PanelId = 'career' | 'projects' | 'biography' | 'contact';

export interface MenuItem {
	id: ItemId;
	label: string;
	href: string;
	external: boolean;
}

const social = (label: string) => contacts.links.find((l) => l.label === label)?.href ?? '#';

export const menuItems: MenuItem[] = [
	{ id: 'career', label: 'Career', href: '#career', external: false },
	{ id: 'projects', label: 'Projects', href: '#projects', external: false },
	{ id: 'biography', label: 'Biography', href: '#biography', external: false },
	{ id: 'resume', label: 'Resume', href: '/resume.pdf', external: true },
	{ id: 'github', label: 'GitHub', href: social('GitHub'), external: true },
	{ id: 'linkedin', label: 'LinkedIn', href: social('LinkedIn'), external: true },
	{ id: 'contact', label: 'Contact', href: '#contact', external: false }
];

export const panelIds: PanelId[] = ['career', 'projects', 'biography', 'contact'];
export const isPanel = (id: string): id is PanelId => (panelIds as string[]).includes(id);

export type CareerEntry = (typeof careers.commits)[number];

const year = (ym: string | null) => (ym ? ym.slice(0, 4) : 'Now');
export const range = (e: { from: string; to: string | null }) =>
	year(e.from) === year(e.to) ? year(e.from) : `${year(e.from)} — ${year(e.to)}`;

/** Ongoing first, then most recent first. */
export const careerEntries: CareerEntry[] = [...careers.commits].sort((a, b) => {
	if ((a.to === null) !== (b.to === null)) return a.to === null ? -1 : 1;
	return (b.to ?? '9999').localeCompare(a.to ?? '9999') || b.from.localeCompare(a.from);
});

export const projects = [...projectsData.projects].sort((a, b) => b.year - a.year);
export const milestones = biographyData.milestones;

const index = (id: ItemId) => String(menuItems.findIndex((m) => m.id === id) + 1).padStart(2, '0');
const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const shortTitle = (t: string) => t.split(' - ')[0];

export const previews: Record<ItemId, Preview> = {
	career: {
		index: index('career'),
		title: 'Career',
		lines: careerEntries
			.filter((e) => e.branch === 'work')
			.slice(0, 5)
			.map((e) => `${shortTitle(e.title)}  ·  ${range(e)}`),
		hint: 'ENTER ↵  OPEN CAREER LOG'
	},
	projects: {
		index: index('projects'),
		title: 'Projects',
		lines: projects.slice(0, 5).map((p) => `${p.year}   ${p.title}`),
		hint: 'ENTER ↵  BROWSE PROJECTS'
	},
	biography: {
		index: index('biography'),
		title: 'Biography',
		lines: [0, 1, 3, 5, milestones.length - 1]
			.map((i) => milestones[i])
			.filter(Boolean)
			.map((m) => `${m.year}   ${m.title}`),
		hint: 'ENTER ↵  READ THE STORY'
	},
	resume: {
		index: index('resume'),
		title: 'Resume',
		lines: ['One-page PDF', contacts.name, contacts.tagline],
		hint: 'ENTER ↵  OPEN PDF'
	},
	github: {
		index: index('github'),
		title: 'GitHub',
		lines: [host(social('GitHub')), 'Code, experiments and side projects'],
		hint: 'ENTER ↵  OPEN GITHUB'
	},
	linkedin: {
		index: index('linkedin'),
		title: 'LinkedIn',
		lines: [host(social('LinkedIn')), 'Professional profile'],
		hint: 'ENTER ↵  OPEN LINKEDIN'
	},
	contact: {
		index: index('contact'),
		title: 'Contact',
		lines: [contacts.email, 'A role, a project, a conversation —', 'get in touch.'],
		hint: 'ENTER ↵  SAY HELLO'
	}
};
