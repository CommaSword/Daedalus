import {FileSystem} from "kissfs";

export class Logs {
    static readonly logPath = 'logFile.md';
    static readonly resourcesPath = './';
    static readonly logInitMetadata = `
---
status : 2
securityClass : 1
name : log
---
`;

    constructor(private fs: FileSystem) {
        this.init();
    }

    async openLogFile(): Promise<string> {
        const log = await this.fs.loadTextFile(Logs.logPath);
        if (log) {
            return log;
        } else {
            await this.init();
            return await this.openLogFile();
        }
    }

    saveLogFile(data: string): void {
        let file = this.fs.saveFile(Logs.logPath, data);
    }

    async writeToLog(newLine: string): Promise<void> {
        console.debug(`writing new line to log file`);
        const log = await this.openLogFile();
        const newLog = `${log}\n${newLine}`;
        this.saveLogFile(newLog);
    }

    private async init() {
        const fsItems = await this.fs.loadDirectoryChildren(".");
        if (!fsItems.find(file => file.type === "file" && file.name === Logs.logPath)) {
            console.info(`Missing log file. Creating a new one ${Logs.logPath}`);
            await this.fs.saveFile(Logs.logPath, Logs.logInitMetadata);
        }
    }
}
