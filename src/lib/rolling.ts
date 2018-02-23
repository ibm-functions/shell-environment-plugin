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

import * as dbgc from 'debug';
import { resolveSpace } from './environment';
import { reroute } from './reroute';
const debug = dbgc('env:rolling');

declare let ow: any;

export enum RollingStrategy { NONE, BLUEGREEN }

export interface IRollingUpdate {
    // The kind of rolling update
    kind: RollingStrategy;
}

//
export function newDefaultRollingStrategy(): IRollingUpdate {
    return { kind: RollingStrategy.NONE };
}

//
export function newBluegreentRollingStrategy(): IBlueGreen {
    return { kind: RollingStrategy.BLUEGREEN, master: BlueGreenTargets.blue };
}

export function checkVersionTag(env: IEnvironment, tag: string) {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.NONE:
            if (tag !== 'master') {
                throw new Error('no version tagging (other than master) allowed when rolling update stragegy is in place');
            }
            break;
        case RollingStrategy.BLUEGREEN:
            if (tag !== 'master' && tag !== 'active' && tag !== 'blue' && tag !== 'green') {
                throw new Error(`Invalid version tag: only 'latest', 'blue' and 'green' is allowed`);
            }
    }
}

// Convert environment version to corresponding IBM cloud space tag
export function getVersionSpaceTag(env: IEnvironment): string {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.BLUEGREEN:
            return getBlueGreenVersionSpaceTag(env.version, env.rolling as IBlueGreen);
        default:
            return '';
    }
}

export async function upgrade(env: IEnvironment) {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.BLUEGREEN:
            await upgradeBlueGreen(env);
            break;
        default:
            throw new Error('this environment does not support rolling update');

    }
}

export const prettyRollingUpdate = ['in place', 'bluegreen'];

// BlueGreen rolling update

enum BlueGreenTargets { blue, green }

export interface IBlueGreen extends IRollingUpdate {
    master: BlueGreenTargets;
}

function getBlueGreenVersionSpaceTag(version: string, bgrolling: IBlueGreen): string {
    if (version && version === 'master')
        return bgrolling.master === BlueGreenTargets.blue ? 'blue' : 'green';

    if (version === 'active')
        return '';
    return version;
}

async function upgradeBlueGreen(env: IEnvironment) {
    const bgrolling = env.rolling as IBlueGreen;

    // Update assets in active environment to point to master
    const activeVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, '') } };
    const activeWskFile = await prepareWskprops(activeVars, false);

    const tag = getBlueGreenVersionSpaceTag('master', bgrolling);
    const targetVars = { ...env.variables, BLUEMIX_SPACE: { value: resolveSpace(env.name, env.variables, tag) } } as any;
    const targetWskFile = await prepareWskprops(targetVars, false);

    const activeProps = parser.read(activeWskFile);
    const targetProps = parser.read(targetWskFile);
    targetProps.NAMESPACE = `${targetVars.BLUEMIX_ORG.value}_${targetVars.BLUEMIX_SPACE.value}`;
    debug(`upgrade to ${targetProps.NAMESPACE}`);

    await reroute(activeProps, targetProps);

    // swap master.
    bgrolling.master = bgrolling.master === BlueGreenTargets.blue ? BlueGreenTargets.green : BlueGreenTargets.blue;
    persistEnvironment(env);
    // clone.

}
