// SPDX-FileCopyrightText: 2022 sirinsidiator <insidiator@cmos.at>
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { Actions, DeferredAction } from '../../common/actions';
import { globals } from '../../frontend/globals';
import { Plugin, PluginContext, PluginDescriptor } from '../../public';
import ESOProfilerExportConverter from './ESOProfilerExporterConverter';

class ESOProfilerPlugin implements Plugin {
    onActivate(_ctx: PluginContext): void {
        const originalDispatch = globals.dispatch;

        function dispatch(action: DeferredAction<{}>) {
            if (action.type === 'openTraceFromFile') {
                const converter = new ESOProfilerExportConverter();
                converter.convert((action.args as any).file).then(file => {
                    (action.args as any).file = file;
                    originalDispatch(action);
                });
            } else {
                originalDispatch(action);
            }
        }
        // dispatch is read-only, so we replace it this way
        (globals as any)._dispatch = dispatch;

        const tauri = (window as any).__TAURI__;
        const { documentDir } = tauri.path;
        const { readTextFile } = tauri.fs;
        const DEFAULT_FILE_NAME = "ESOProfiler.lua";
        documentDir().then((DOCUMENTS: string) => {
            readTextFile(`${DOCUMENTS}/Elder Scrolls Online/live/SavedVariables/${DEFAULT_FILE_NAME}`).then((content: string) => {
                globals.dispatch(Actions.openTraceFromFile({ file: new File([content], DEFAULT_FILE_NAME) }));
            });
        });

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/custom.css';
        document.head.append(css);

        document.onclick = e => {
            const target: HTMLElement = e.target as HTMLElement;
            if (target?.textContent) {
                if (target.textContent.startsWith("@/EsoUI")) {
                    location.href = `esoui-dev:${target.textContent.substring(2)}`;
                } else if (target.textContent.startsWith("@user:")) {
                    location.href = `esoui-dev:${target.textContent.substring(1)}`;
                }
            }
        };
    }
}

export const plugin: PluginDescriptor = {
    pluginId: 'ESOProfiler',
    plugin: ESOProfilerPlugin,
};
