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
import { IEnvironment } from "./store";
import { prepareWskprops, IWskProps } from "./bluemix";
import { NamespaceRolling } from "./namespace-rolling";
import * as openwhisk from "openwhisk";

import * as dbgc from 'debug';
const debug = dbgc('env:environment');

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

export function getVersionTag(env: IEnvironment): string {
    const kind = env.rolling ? env.rolling.kind : 'NONE';
    switch (kind) {
        case RollingStrategy.BLUEGREEN:
            const bgrolling = env.rolling as IBlueGreen;
            if (env.version && env.version === 'master')
                return bgrolling.master === BlueGreenTargets.blue ? 'blue' : 'green';
            if (env.version === 'active')
                return '';
            return env.version;
        default:
            return '';
    }
}

export const prettyRollingUpdate = ['in place', 'bluegreen'];

// Blue Green rolling update

enum BlueGreenTargets { blue, green }

export interface IBlueGreen extends IRollingUpdate {
    master: BlueGreenTargets;
}
