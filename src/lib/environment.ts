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

import * as parser from 'properties-parser';
import { syncEnvName } from "./ui";
import { setCurrentEnvironment, getCurrentEnvironment, IEnvironment, IVariables, persistEnvironment, IVariable, getEnvironments } from "./store";
import { prepareWskprops, escapeNamespace } from "./bluemix";
import { newBluegreentRollingStrategy, getVersionTag, checkVersionTag } from './rolling';
import { clone } from './clone';

import * as dbgc from 'debug';
const debug = dbgc('env:environment');

export class ErrorMissingVariable extends Error {
    constructor(public name: string) {
        super(`missing ${name} variable`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export async function setEnvironment(wsk, name: string, version: string) {
    // Update global .wskprops
    const env = getEnvironments()[name];
    checkVersionTag(env, version);

    env.version = version;
    persistEnvironment(env);

    resolveSpace(env);
    const wskpropsfile = await prepareWskprops(env, true);

    // Refresh OW client. Depends on rolling update strategy.
    await initOW(wsk, env, wskpropsfile);

    // Update store
    setCurrentEnvironment(name);

    // Update UI
    syncEnvName();
}

// Initialize OW client. Involved rolling update strategy as needed.
async function initOW(wsk, env: IEnvironment, wskpropsFile: string) {
    debug(`initOW with ${wskpropsFile}`);
    const wskprops = parser.read(wskpropsFile);
    await wsk.auth.set(wskprops.AUTH);
    await wsk.apiHost.set(wskprops.APIHOST);
}

function resolveSpace(env: IEnvironment): void {
    const bxspace = getVar(env.variables || {}, 'BLUEMIX_SPACE_PREFIX');
    const tag = getVersionTag(env);
    const resolved = escapeNamespace(`${bxspace}-${env.name}${tag ? `@${tag}` : ''}`);

    setVar(env, 'BLUEMIX_SPACE', { value: resolved, iscomputed: true });
}

function getProjectPlugin(prequire) {
    try {
        return prequire('shell-project-plugin');
    } catch (e) {
        // no project, fine
        return null;
    }
}

export function getVar(vars: IVariables, name: string) {
    const variable = vars[name];
    if (!variable || !variable.value)
        throw new ErrorMissingVariable(name);
    return variable.value;
}

export function setVar(env: IEnvironment, name: string, value: IVariable) {
    env.variables = env.variables || {};
    env.variables[name] = value;
    persistEnvironment(env);
}

export function deleteVar(env: IEnvironment, name: string) {
    env.variables = env.variables || {};
    delete env.variables[name];
    persistEnvironment(env);
}

export async function copyTo(from: IEnvironment, to: IEnvironment) {
    const fromWskFile = await prepareWskprops(from, false);
    const toWskFile = await prepareWskprops(to, false);

    const fromwskprops = parser.read(fromWskFile);
    const towskprops = parser.read(toWskFile);

    return clone(fromwskprops, towskprops);
}

// Enable bluegreen strategy for the given environment.
export async function enableBluegreen(wsk, env: IEnvironment) {
    env.rolling = newBluegreentRollingStrategy();
    persistEnvironment(env);

    await setEnvironment(wsk, env.name, 'latest');
}
