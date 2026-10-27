import contacts from '$lib/data/contacts.json';
import careers from '$lib/data/careers.json';
import projectsData from '$lib/data/projects.json';

// Plain-text profile for AI assistants and crawlers (llmstxt.org), built from the same data as the page.
export const prerender = true;

const SITE = 'https://ruzauskas.lt';
const year = (ym: string | null) => (ym ? ym.slice(0, 4) : 'now');

export function GET() {
	// Current roles (no end date) first, then most recently ended.
	const commits = [...careers.commits].sort((a, b) => (b.to ?? '9999').localeCompare(a.to ?? '9999'));
	const work = commits.filter((c) => c.branch === 'work');
	const education = commits.filter((c) => c.branch === 'education');
	const projects = [...projectsData.projects].sort((a, b) => b.year - a.year);

	const entry = (c: (typeof commits)[number]) =>
		`- ${c.title} (${year(c.from)}–${year(c.to)}): ${c.summary}`;
	const project = (p: (typeof projects)[number]) => {
		const links = p.links.map((l) => `[${l.label}](${l.href})`).join(', ');
		return `- ${p.title} (${p.year}): ${p.summary}${links ? ` ${links}` : ''}`;
	};

	const body = `# ${contacts.name} (Lukas Ruzauskas)

> ${contacts.name} is an AI product engineer, software developer and systems analyst from Kaunas, Lithuania. Product Owner / Systems Analyst at Dassault Systèmes since 2018 for CATIA Magic / MagicDraw (MBSE, SysML), owning persistence and collaboration features (Teamwork Cloud, 3DEXPERIENCE). Works directly with senior engineers and managers at NASA JPL, Boeing, Airbus, Apple, Volkswagen Group, BMW, Renault, KNDS and Northrop Grumman. Builds AI-powered tools and full-stack web apps with agentic coding.

- Location: Kaunas, Lithuania (EU citizen). Languages: English, Lithuanian.
- Skills: agentic coding (Claude Code), AI agents, TypeScript, React, Next.js, SvelteKit, Node, Nest.js, PostgreSQL, Supabase, WebSockets, Stripe, Docker, Linux; MBSE, SysML v1/v2, UML, requirements engineering, fault tree analysis.
- Contact: ${contacts.email}

## Links

- [Portfolio](${SITE}/): career, projects, biography, contact
- [Resume (PDF)](${SITE}/Lukas_Ruzauskas.pdf)
${contacts.links.map((l) => `- [${l.label}](${l.href})`).join('\n')}

## Experience

${work.map(entry).join('\n')}

## Education

${education.map(entry).join('\n')}

## Projects

${projects.map(project).join('\n')}
`;

	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
