// global.d.ts
declare module global {
    var paths: {
        ast: string;
        res: string;
        output: string;
    }
    var settings: any;
}

declare module 'xml-writer' {
    class XMLWriter {
        constructor(indent?: boolean);
        startDocument(encoding?: string, standalone?: string): void;
        writeDocType(rootElement: string, publicId?: string, systemId?: string): void;
        startElement(name: string): void;
        writeAttribute(name: string, value: string): void;
        text(value: string): void;
        endElement(): void;
        endDocument(): void;
        toString(): string;
    }
    export { XMLWriter };
}