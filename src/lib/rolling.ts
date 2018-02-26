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
import { IEnvironment, IVariable, persistEnvironment } from "./store";
import { prepareWskprops, IWskProps } from "./bluemix";
import * as openwhisk from "openwhisk";
import { resolveSpace } from './environment';
import { reroute } from './reroute';
import { ReleaseType, inc } from 'semver';
import { clone } from './clone';
import * as dbgc from 'debug';

const debug = dbgc('env:rolling');

declare let ow: any;

export enum RollingStrategy { NONE, REPLACE, INCREMENTAL }

export interface IRollingUpdate {
    // The kind of rolling update
    kind: RollingStrategy;
}

//
export function newDefaultRollingStrategy(): IRollingUpdate {
    return { kind: RollingStrategy.NONE };
}

//
export function newIncrementalRollingStrategy(): IIncrementalUpdate {
    return { kind: RollingStrategy.INCREMENTAL, versions: [] };
}

// Convert environment version to corresponding IBM cloud space tag
export function getVersionSpaceTag(env: IEnvironment): string {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.INCREMENTAL:
            return getIncrementalVersionSpaceTag(env.version, env.rolling as IIncrementalUpdate);
        default:
            return '';
    }
}

export function checkVersionTag(env: IEnvironment, tag: string) {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.NONE:
            if (tag !== 'master') {
                throw new Error('no version tagging (other than master) allowed when rolling update stragegy is in place');
            }
            break;
        case RollingStrategy.INCREMENTAL:
            if (tag !== 'master' && tag !== 'active' && tag !== 'blue' && tag !== 'green') {
                throw new Error(`Invalid version tag: only 'latest', 'blue' and 'green' is allowed`);
            }
    }
}

export async function upgrade(env: IEnvironment, options?) {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.INCREMENTAL:
            await incrementalUpgrade(env, options);
            break;
        default:
            throw new Error('this environment does not support rolling update');

    }
}

export async function downgrade(env: IEnvironment) {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.INCREMENTAL:
            await incrementalDowngrade(env);
            break;
        default:
            throw new Error('this environment does not support rolling update');

    }
}

export const prettyRollingUpdate = ['none', 'incremental'];

// Incremental rolling update

export interface IIncrementalUpdate extends IRollingUpdate {
    // Versioned deployments
    versions?: string[];

    // currently active version
    version?;
}

function getIncrementalVersionSpaceTag(version: string, rolling: IIncrementalUpdate): string {
    return version === 'active' ? '' : version;
}

async function incrementalUpgrade(env: IEnvironment, options) {
    // TODO: server side.
    const incrolling = env.rolling as IIncrementalUpdate;

    // Clone master to new deployment
    const count = incrolling.versions.length;
    const latest = count > 0 ? incrolling.versions[count - 1] : '0.0.1';
    const newest = inc(latest, options.releaseType);

    const masterVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, 'master') } };
    const masterWskFile = await prepareWskprops(masterVars, false);
    const masterProps = parser.read(masterWskFile);

    const newestVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, newest) } };
    const newestWskFile = await prepareWskprops(newestVars, false);
    const newestProps = parser.read(newestWskFile);

    await clone(masterProps, newestProps);

    // Update assets in active environment to point to newest
    const activeVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, '') } };
    const activeWskFile = await prepareWskprops(activeVars, false);
    const activeProps = parser.read(activeWskFile);

    newestProps.NAMESPACE = `${newestProps.BLUEMIX_ORG.value}_${newestProps.BLUEMIX_SPACE.value}`;
    debug(`upgrade to ${newestProps.NAMESPACE}`);

    await reroute(activeProps, newestProps);

    // commit
    incrolling.versions.push(newest);
    incrolling.version = newest;
    persistEnvironment(env);
}

async function incrementalDowngrade(env: IEnvironment) {
    // TODO: server side.
    const incrolling = env.rolling as IIncrementalUpdate;

    const count = incrolling.versions.length;
    if (count < 2)
        throw new Error('no available previous deployments');

    const latest = count > 0 ? incrolling.versions[count - 1] : '0.0.1';
    const previous = incrolling.versions[count - 2];

    // Update assets in active environment to point to previous
    const previousVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, previous) } };
    const previousWskFile = await prepareWskprops(previousVars, false);
    const previousProps = parser.read(previousWskFile);

    const activeVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, '') } };
    const activeWskFile = await prepareWskprops(activeVars, false);
    const activeProps = parser.read(activeWskFile);

    previousProps.NAMESPACE = `${previousProps.BLUEMIX_ORG.value}_${previousProps.BLUEMIX_SPACE.value}`;
    debug(`downgrade to ${previousProps.NAMESPACE}`);

    await reroute(activeProps, previousProps);

    // commit
    incrolling.version = previous;
    persistEnvironment(env);
}
