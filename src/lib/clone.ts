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
import { IWskProps } from './bluemix';
import * as openwhisk from 'openwhisk';
import * as dbgc from 'debug';

const debug = dbgc('env:clone');

export async function clone(from: IWskProps, to: IWskProps) {
    debug('start cloning namespace');
    const wskfrom = openwhisk({ apihost: from.APIHOST, api_key: from.AUTH });
    const wskto = openwhisk({ apihost: to.APIHOST, api_key: to.AUTH });

    await clonePackages(wskfrom, wskto);
    await cloneActions(wskfrom, wskto);
    debug('end cloning namespace');

}

async function clonePackages(from: openwhisk.Client, to: openwhisk.Client): Promise<any[]> {
    const pkgs = await listPackages(from, 0);
    if (pkgs.length > 0) {
        let promises = [];
        pkgs.forEach(pkg => {
            promises.push(clonePackage(from, to, pkg));
        });
        return Promise.all(promises);
    }
}

async function clonePackage(from: openwhisk.Client, to: openwhisk.Client, pkg: openwhisk.Package): Promise<void> {
    const content = await from.packages.get(pkg.name);
    to.packages.create({ name: content.name, package: content });
}

async function cloneActions(from: openwhisk.Client, to: openwhisk.Client): Promise<void> {
    const actions = await listActions(from, 0);
    if (actions.length > 0) {
        let promises = [];
        let sequences = [];
        for (let action of actions) {
            const content = await from.actions.get(action.name);
            const clone = await to.actions.create({ name: content.name, action: content });
            if (content.exec.kind === 'sequence')
                sequences.push(clone);
            else
                promises.push(clone);
        }

        await Promise.all(promises);
        await Promise.all(sequences);
    }
}

async function listPackages(from: openwhisk.Client, skip: number): Promise<openwhisk.PackageDesc[]> {
    const pkgs = await from.packages.list({ skip, limit: 200 });
    return pkgs.length === 200 ? [...pkgs, ...(await listPackages(from, skip + 200))] : pkgs;
}

async function listActions(from: openwhisk.Client, skip: number): Promise<openwhisk.ActionDesc[]> {
    const actions = await from.actions.list({ skip, limit: 200 });
    return actions.length === 200 ? [...actions, ...(await listActions(from, skip + 200))] : actions;
}
