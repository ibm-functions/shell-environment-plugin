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
import { EventEmitter } from 'events';
import { error } from './cli';
import { IRollingUpdateState, newDefaultRollingUpdate } from './rolling';

import * as dbgc from 'debug';
const debug = dbgc('env:store');

declare const eventBus: EventEmitter;

// --- Environment store

export interface IVariable {
    // Variable name
    name?: string;

    // Variable value
    value: string;

    // Computed or userdefined?
    iscomputed?: boolean;

    // secret?
    issecret?: boolean;
}

export interface IVariables {
    [key: string]: IVariable;
}

export interface IEnvironment {
    // Environment name
    name: string;

    // whether the assets in this environment are readonly
    readonly: boolean;

    // rolling update state
    rolling: IRollingUpdateState;

    // Cached environment variables
    variables: IVariables;

    // Backend store
    store: IVariableStore;
}

export interface IEnvironments { [key: string]: IEnvironment; }

const envkey = 'wsk.env';
const envcurrentkey = 'wsk.env.current';

export function newEnvironment(name: string, store: StoreKind): IEnvironment {
    const envs = getEnvironments();
    if (envs[name])
        throw new Error(`environment ${name} already exists`);

    envs[name] = { name, readonly: false, rolling: newDefaultRollingUpdate(), store: newStore(store), variables: {} };
    setEnvironments(envs);
    return envs[name];
}

export function getEnvironments(): IEnvironments {
    return JSON.parse(localStorage.getItem(envkey) || '{}');
}

export function setEnvironments(envs: IEnvironments) {
    localStorage.setItem(envkey, JSON.stringify(envs));
}

export function getCurrentEnvironment(): IEnvironment {
    const name = localStorage.getItem(envcurrentkey);
    if (name) {
        const env = getEnvironments();
        return env[name];
    }
    return null;
}

export function getCurrentEnvironmentOrError(errors): IEnvironment {
    const name = localStorage.getItem(envcurrentkey);
    if (name) {
        const env = getEnvironments();
        return env[name];
    }
    error(error, 'no environment set');
}

export function updateEnvironment(env: IEnvironment) {
    const envs = getEnvironments();
    envs[env.name] = env;
    setEnvironments(envs);
}

export function setCurrentEnvironment(envname: string) {
    localStorage.setItem(envcurrentkey, envname);
    eventBus.emit('/env/set', { name: envname });
}

// --- Generic variable persistence store

export enum StoreKind { LOCAL }

export interface IVariableStore {
    /* Get all environment variables */
    getVariableNames(): Array<string>;

    /* Set variable value */
    setValue(name: string, value: IVariable);

    /* Get variable value  */
    getValue(name: string): IVariable;
}

/* Create new store of the given kind */
export function newStore(kind: StoreKind): IVariableStore {
    switch (kind) {
        case StoreKind.LOCAL:
            return newLocalStore();
        default:
            throw new Error(`invalid store kind: ${kind}`);
    }
}

// --- Local Store
class LocalStore implements IVariableStore {
    variables: { [key: string]: IVariable } = {};

    getVariableNames(): string[] {
        return Object.keys(this.variables);
    }

    setValue(name: string, value: IVariable) {
        value.name = name;
        this.variables[name] = value;
    }

    getValue(name: string): IVariable {
        return this.variables[name];
    }
}

export function newLocalStore() {
    return new LocalStore();
}
