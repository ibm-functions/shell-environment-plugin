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
import { Client, Package, KeyVal, Action } from 'openwhisk';
import { parseQName, resolveQName, makeQName } from './names';

export async function reroute(active: IWskProps, target: IWskProps) {
    const owactive = openwhisk({ apihost: active.APIHOST, api_key: active.AUTH });
    const owtarget = openwhisk({ apihost: target.APIHOST, api_key: target.AUTH });

    const targetOpts = {
        client: owtarget,
        params: [
            { key: '__OW_TARGET_API_HOST', value: target.APIHOST },
            { key: '__OW_TARGET_API_KEY', value: target.AUTH },
            { key: '__OW_TARGET_NAMESPACE', value: target.NAMESPACE }]
    };
    try {
        await reroutePackages(owactive, targetOpts);
        await rerouteActions(owactive, targetOpts);
    } catch (e) {
        console.log(e);
        throw e;
    }
}

interface ITarget {
    client: Client;
    params: KeyVal[];
}

async function reroutePackages(active: Client, target: ITarget): Promise<any[]> {
    const pkgs = await listPackages(target.client, 0);
    if (pkgs.length > 0) {
        let promises = [];
        pkgs.forEach(pkg => {
            promises.push(reroutePackage(active, target, pkg));
        });
        return Promise.all(promises);
    }
}

async function reroutePackage(active: Client, target: ITarget, pkg: Package): Promise<void> {
    const body = { name: pkg.name, package: { parameters: target.params } };
    await active.packages.update(body as Package);

    if (pkg.binding) {
        // TODO: create actions

    }
}

async function rerouteActions(active: Client, target: ITarget): Promise<any[]> {
    const actions = await listActions(target.client, 0);
    if (actions.length > 0) {
        let promises = [];
        actions.forEach(action => {
            promises.push(rerouteAction(active, target, action));
        });
        return Promise.all(promises);
    }
}

async function rerouteAction(active: Client, target: ITarget, action: openwhisk.ActionDesc): Promise<void> {
    console.log(action);
    const qname = parseQName(`/${action.namespace}/${action.name}`);
    const name = makeQName('_', qname.pkg, qname.name);
    console.log(name);
    const options = {
        name,
        action: {
            exec: {
                code: authInvokeCode,
                kind: 'nodejs:6'
            }
        }
    };
    await active.actions.update(options as any);
}

async function listPackages(from: openwhisk.Client, skip: number): Promise<openwhisk.PackageDesc[]> {
    const pkgs = await from.packages.list({ skip, limit: 200 });
    return pkgs.length === 200 ? [...pkgs, ...(await listPackages(from, skip + 200))] : pkgs;
}

async function listActions(from: openwhisk.Client, skip: number): Promise<openwhisk.ActionDesc[]> {
    const actions = await from.actions.list({ skip, limit: 200 });
    return actions.length === 200 ? [...actions, ...(await listActions(from, skip + 200))] : actions;
}

const authInvokeCode = `const openwhisk = require("openwhisk");
function main(params) {
    const apihost = params.__OW_TARGET_API_HOST;
    const api_key = params.__OW_TARGET_API_KEY;
    const namespace = params.__OW_TARGET_NAMESPACE;
    delete params.__OW_TARGET_API_HOST;
    delete params.__OW_TARGET_API_KEY;
    const qname = process.env.__OW_ACTION_NAME;
    const actionName = qname.substr(qname.indexOf('/', 1) + 1);
    const ow = openwhisk({ namespace, apihost, api_key });
    return ow.actions.invoke({ actionName, params, blocking: true });
}`;
