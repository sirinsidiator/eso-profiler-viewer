// SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>
//
// SPDX-License-Identifier: GPL-3.0-or-later

const PID = 0;
const TID = 0;

interface ProfilerData {
    traceEvents: any[],
    stackFrames: any,
    otherData: any,
}

export default class ESOProfilerExportConverter {
    eventStack: any[] = [];
    data: ProfilerData = {
        traceEvents: [],
        stackFrames: {},
        otherData: {}
    };
    names: any;
    categories: any;
    closures: any;
    uptime?: number;


    addCounter(name: string, unit: string, start: number, value: number) {
        let args: any = {};
        args[`[${unit}]`] = value;
        let event = {
            name: name,
            ph: "C",
            cat: "stats",
            ts: start,
            pid: PID,
            tid: TID,
            args: args
        };
        this.data.traceEvents.push(event);
    }

    fillInNames() {
        let data = this.data;
        Object.keys(data.stackFrames).forEach(stackId => {
            let stackFrame = data.stackFrames[stackId];
            let [name, file, line] = this.closures[stackFrame.name];

            this.names[stackId] = name;
            stackFrame["id"] = stackId;
            stackFrame["location"] = file + ":" + line;
            let matches = file.match(/@user:\/AddOns\/(.+?)\//);
            if (matches && matches.length > 1) {
                this.categories[stackId] = matches[1];
            } else {
                let matches = file.match(/@user:\/SavedVariables\/(.+?)/);
                if (matches && matches.length > 1) {
                    this.categories[stackId] = "SavedVariables";
                }
            }
        });

        data.traceEvents.forEach(event => {
            if (!event.name) {
                event.name = this.names[event.sf];
                if (this.categories[event.sf]) {
                    event.cat = this.categories[event.sf];
                }
            }
            if (!event.args) {
                event.args = this.data.stackFrames[event.sf];
            }
        });
    }

    addMetaData(name: string, args: any) {
        this.data.traceEvents.unshift({
            name: name,
            cat: "__metadata",
            ts: 0,
            ph: "M",
            args: args,
            pid: PID,
            tid: TID
        });
    }

    getParentEvent(): any {
        if (this.eventStack.length > 0) {
            return this.eventStack[this.eventStack.length - 1];
        }
        return null;
    }

    cleanUpEventStack(currentTime: number) {
        for (let i = this.eventStack.length - 1; i >= 0; --i) {
            let event = this.eventStack[i];
            if (event.ts + event.dur < currentTime) {
                this.eventStack.pop();
            }
        }
    }

    parseFileContent(content: string) {
        this.names = {};
        this.closures = {};
        this.categories = {};
        this.data = {
            traceEvents: [],
            stackFrames: {},
            otherData: {},
        }

        let jsonContent = this.convertLuaToJSONString(content);
        let parsed = JSON.parse(jsonContent)["ESOProfiler_Export"];

        for (const eventIndex in parsed["traceEvents"]) {
            const raw = parsed["traceEvents"][eventIndex];
            let data = raw.split(",");
            let event = {
                name: "",
                cat: "EsoUI",
                ph: "X",
                ts: parseFloat(data[0]),
                dur: parseFloat(data[1]),
                tts: parseFloat(data[0]),
                tdur: parseFloat(data[1]),
                pid: PID,
                tid: TID,
                sf: data[2]
            };
            this.data.traceEvents.push(event);

            this.cleanUpEventStack(event.ts);
            let parentEvent = this.getParentEvent();
            if (parentEvent) {
                parentEvent.tdur -= event.dur;
            }
            this.eventStack.push(event);
        }

        for (const stackId in parsed["stackFrames"]) {
            const raw = parsed["stackFrames"][stackId];
            let [recordDataIndex, parent] = raw.split(",");
            let stackFrame: any = {};
            stackFrame["name"] = recordDataIndex;
            if (parent) {
                stackFrame["parent"] = parent;
            }
            this.data.stackFrames[stackId] = stackFrame;
        }

        for (const recordDataIndex in parsed["closures"]) {
            const raw = parsed["closures"][recordDataIndex];
            let data = raw.split(",");
            this.closures[recordDataIndex] = data;
        }

        for (const frameIndex in parsed["frameStats"]) {
            const raw = parsed["frameStats"][frameIndex];
            let [start, fps, latency, memory] = raw.split(",");
            let startTime = parseFloat(start);
            this.addCounter("FPS", "Hz", startTime, parseInt(fps) / 100);
            this.addCounter("Latency", "ms", startTime, parseInt(latency));
            this.addCounter("Memory", "MB", startTime, parseInt(memory) / (1024 * 1024));
        }

        for (const key in parsed["otherData"]) {
            const value = parsed["otherData"][key];
            this.data.otherData[key] = "" + value;
            if (key === "upTime") {
                this.uptime = Math.floor(parseFloat(value) / 1e6);
            }
        }

        this.fillInNames();
        this.addMetaData("process_name", { "name": "eso64.exe" });
        this.addMetaData("process_uptime_seconds", { "uptime": this.uptime });
        this.addMetaData("thread_name", { "name": "User Interface" });
    }

    async convert(file: File): Promise<File> {
        let content = await file.text();
        this.parseFileContent(content);
        let newContent = JSON.stringify(this.data, null, 2);
        return new File([newContent], file.name.replace(".lua", ".json"), { type: "application/json" });
    }

    private convertLuaToJSONString(content: string): string {
        let lines = content.split(/[\r\n]+/g);
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i];

            // add comma after all root level entries except for the last one
            if (i > 0 && line.search(/^(\w+)\s*=$/) !== -1) {
                lines[i - 1] = lines[i - 1] + ",";
            }
            // convert root level entries to proper json format
            line = line.replace(/^(\w+)\s*=\s*(\{\s*)?$/, '"$1":$2');

            // convert all string keys to proper json format
            line = line.replace(/^(\s+)\["(.+)"\]\s*=(.+)$/, '$1"$2":$3');

            // convert all numeric keys to proper json format
            line = line.replace(/^(\s+)\[(\d+)\]\s*=(.+)$/, '$1"$2":$3');

            // remove comma after last entry of a table
            if (i > 0 && line.search(/^\s*\}/) !== -1 && !lines[i - 1].endsWith("{")) {
                lines[i - 1] = lines[i - 1].slice(0, -1);
            }

            lines[i] = line;
        }

        return "{" + lines.join("\r\n") + "}";
    }
}
