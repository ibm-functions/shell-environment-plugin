/*
 * Copyright 2018 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { syncEnvName } from "./ui";
import { setCurrentEnvironment, getCurrentEnvironment } from "./store";
import { prepareWskprops, ErrorMissingVariable } from "./bluemix";

declare const ui: any;
// declare const repl: any;

export function error(errors, msg: string, usage = '') {
    throw new errors.usage(`${msg}${usage ? '\n\n' : ''}${usage}`);
}

export function consume(argv, options: string[]) {
    return options.reduce((value, option) => {
        const v = argv[option];
        delete argv[option];
        return value || v;
    }, undefined);
}

export function checkExtraneous(modules, argv) {
    if (argv._.length !== 0)
        throw new modules.errors.usage(`Extraneous argument(s): ${argv._.join(', ')}`);
}

export function checkExtraneousFlags(modules, argv) {
    delete argv._;
    if (Object.keys(argv).length !== 0)
        throw new modules.errors.usage(`Extraneous flags(s): ${Object.keys(argv).join(', ')}`);
}

export function sliceCmd(argv, cmd) {
    argv._ = argv._.slice(argv._.indexOf(cmd) + 1);
}

export async function delay(ms) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
}

export async function setEnvironment(name: string, prequire) {
    setCurrentEnvironment(name);
    syncEnvName();

    const project = getProjectPlugin(prequire);
    const wsk = prequire('/ui/commands/openwhisk-core');

    // update .wskprops
    let projname;
    if (project) {
        const cproj = project.current();
        projname = cproj ? cproj.name : null;
    }
    const currentenv = getCurrentEnvironment();
    await prepareWskprops(wsk, currentenv, projname);
}

function getProjectPlugin(prequire) {
    try {
        return prequire('shell-project-plugin');
    } catch (e) {
        // no project, fine
        return null;
    }
}
