export function openPrintWindow({
	html,
	features = 'width=1100,height=1400',
	printDelay = 250,
	onPopupBlocked,
}) {
	const printWindow = window.open('', '', features);

	if (!printWindow) {
		onPopupBlocked?.();
		return null;
	}

	const parser = new DOMParser();
	const parsedDocument = parser.parseFromString(html, 'text/html');
	const { document: printDocument } = printWindow;

	printDocument.documentElement.lang = parsedDocument.documentElement.lang || 'en';
	printDocument.head.replaceChildren(
		...Array.from(parsedDocument.head.childNodes, (node) => printDocument.importNode(node, true)),
	);
	printDocument.body.replaceChildren(
		...Array.from(parsedDocument.body.childNodes, (node) => printDocument.importNode(node, true)),
	);

	const triggerPrint = () => {
		printWindow.focus();
		window.setTimeout(() => {
			printWindow.print();
			printWindow.close();
		}, printDelay);
	};

	const pendingImages = Array.from(printDocument.images).filter((image) => !image.complete);

	if (pendingImages.length === 0) {
		triggerPrint();
		return printWindow;
	}

	let remainingImages = pendingImages.length;
	const handleImageReady = () => {
		remainingImages -= 1;
		if (remainingImages <= 0) {
			triggerPrint();
		}
	};

	pendingImages.forEach((image) => {
		image.addEventListener('load', handleImageReady, { once: true });
		image.addEventListener('error', handleImageReady, { once: true });
	});

	return printWindow;
}