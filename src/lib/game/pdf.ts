import type { PDFDocumentProxy } from 'pdfjs-dist';

type PdfJs = typeof import('pdfjs-dist');

let lib: Promise<PdfJs> | null = null;
const docs = new Map<string, Promise<PDFDocumentProxy>>();

/** Lazy-load pdf.js (+ its worker). Safe to call early, e.g. on menu hover. */
export function loadPdfJs(): Promise<PdfJs> {
	lib ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
		([pdfjs, worker]) => {
			// `?v=2`: an early preview served this file with the wrong MIME type and browsers
			// cached that response as immutable; a new query gives them a fresh cache key.
			pdfjs.GlobalWorkerOptions.workerSrc = `${worker.default}?v=2`;
			return pdfjs;
		}
	);
	return lib;
}

export function loadPdf(url: string): Promise<PDFDocumentProxy> {
	let doc = docs.get(url);
	if (!doc) {
		doc = loadPdfJs().then((pdfjs) => pdfjs.getDocument({ url }).promise);
		doc.catch(() => docs.delete(url));
		docs.set(url, doc);
	}
	return doc;
}
