import { IEnvironment } from "./store";
import { copyTo } from "./bluemix";

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
export enum RollingUpdateKind { OFF, BLUEGREEN }

export interface IRollingUpdateState {
    // The kind of rolling update
    kind: RollingUpdateKind;
}

// Get the IBM cloud space annotation
export function newDefaultRollingUpdate(): IRollingUpdateState {
    return { kind: RollingUpdateKind.OFF };

}

// Get the IBM cloud space annotation
export function getSpaceAnnotation(state: IRollingUpdateState): string {
    if (!state) return "";

    switch (state.kind) {
        case RollingUpdateKind.OFF:
            return "";
        case RollingUpdateKind.BLUEGREEN:
            return `@${(state as IBlueGreen).target}`;
    }
}

// Blue Green rolling update

enum BlueGreenTargets { blue, green }

export interface IBlueGreen extends IRollingUpdateState {
    target: BlueGreenTargets;
}

// Convert environment to bluegreen
export async function enableBluegreen(env: IEnvironment) {
    const blueEnv = { ...env };
    blueEnv.rolling = { kind: RollingUpdateKind.BLUEGREEN, target: BlueGreenTargets.blue } as IRollingUpdateState;

    const greenEnv = { ...env };
    greenEnv.rolling = { kind: RollingUpdateKind.BLUEGREEN, target: BlueGreenTargets.green } as IRollingUpdateState;

    return copyTo(env, blueEnv);
}
