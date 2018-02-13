/*
 * Copyright 2017 IBM Corporation
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
import * as request from 'request-promise';
import { homedir } from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child-process-promise';
import * as parser from 'properties-parser';

import * as dbgc from 'debug';
const debug = dbgc('env:bluemix');

// @return true if Bluemix with wsk plugin is available on this system, false otherwise
export async function isBluemixCapable() {
    if (process.env.BLUEMIX_API_KEY) {
        try {
            await exec('bx wsk help');
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

export interface ICredential {
    endpoint?: string;
    apikey?: string;
    org?: string;
    space?: string;
    home?: string;
}

export interface IWskProps {
    APIHOST?: string;
    AUTH?: string;
    IGNORE_CERTS?: boolean;
    APIGW_ACCESS_TOKEN?: string;
    [key: string]: any;
}

const wskProps = (cred: ICredential) => `${cred.home}/.wskprops`;

// Run bluemix command. Retries once if not logged in.
export async function run(cred: ICredential, cmd: string) {
    cred = fixupCredentials(cred);
    return doRun(cred, cmd);
}

async function doRun(cred: ICredential, cmd: string) {
    const bx = `WSK_CONFIG_FILE=${wskProps(cred)} BLUEMIX_HOME=${cred.home} bx ${cmd}`;
    debug(`exec ${bx}`);
    try {
        return await exec(bx);
    } catch (e) {
        if (await doLogin(cred))
            return doRun(cred, cmd); //  tokens have been refreshed. Retry command.
        else {
            throw e; // something else happened.
        }
    }
}

// Login to Bluemix
async function login(cred: ICredential) {
    cred = fixupCredentials(cred);
    try {
        try {
            await doRun(cred, 'target');
        } catch (e) {
            await doLogin(cred);
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Login to Bluemix. @return true if tokens have been refreshed.
async function doLogin(cred: ICredential) {
    try {
        const target = `WSK_CONFIG_FILE=${wskProps(cred)} BLUEMIX_HOME=${cred.home} bx target`;
        debug(`exec ${target}`);
        await exec(target);
        return false;
    } catch (e) {
        await refreshTokens(cred);
        return true;
    }
}

async function refreshTokens(cred: ICredential) {
    const space = cred.space ? `-s ${cred.space}` : '';
    const bx = `WSK_CONFIG_FILE=${wskProps(cred)} BLUEMIX_HOME=${cred.home} bx login -a ${cred.endpoint} --apikey ${cred.apikey} -o ${cred.org} ${space}`;
    try {
        await exec(bx);
    } catch (e) {
        if (space && e.stdout && e.stdout.includes(`Space '${cred.space}' was not found.`)) {
            // space does not exist and requested => create.
            const newspace = `WSK_CONFIG_FILE=${wskProps(cred)} BLUEMIX_HOME=${cred.home} bx account space-create ${cred.space}`;
            await exec(newspace);
        } else {
            debug(e);
            throw e;
        }
    }
    return true;
}

// Install Cloud function plugin
export async function installWskPlugin(cred: ICredential) {
    try {
        await run(cred, 'wsk');
    } catch (e) {
        debug('installing IBM cloud function plugin');
        await run(cred, 'plugin install Cloud-Functions -r Bluemix -f');
    }
}

//
export function fixupCredentials(cred: ICredential) {
    cred = cred || {};
    cred.endpoint = cred.endpoint || 'api.ng.bluemix.net';
    cred.apikey = cred.apikey || process.env.BLUEMIX_API_KEY;
    if (!cred.apikey) {
        throw new Error('cannot login to Bluemix: missing apikey');
    }
    cred.org = cred.org || process.env.BLUEMIX_ORG;
    if (!cred.org) {
        throw new Error('cannot login to Bluemix: missing org');
    }
    if (!cred.space && !cred.home) {
        throw new Error('cannot login to Bluemix: missing either space or home');
    }
    if (!cred.home) {
        cred.home = path.join(homedir(), '.cloudshell', 'bluemix', cred.endpoint, cred.org, cred.space);
    }
    return cred;
}

export async function ensureSpaceExists(cred: ICredential) {
    debug(`checking ${cred.space} space exists`);
    cred = fixupCredentials(cred);

    await doRun(cred, `account space-create ${cred.space}`); // fast when already exists
    await doRun(cred, `target -s ${cred.space}`);

    await installWskPlugin(cred);
    await refreshWskProps(cred, 30); // refresh .wskprops
}

async function refreshWskProps(cred: ICredential, retries: number) {
    if (retries <= 0)
        throw new Error('unable to obtain wsk authentication key. try again later.');

    const io = await doRun(cred, 'wsk property get');
    if (io.stderr) {
        // await delay(1000);
        debug(`could not get wsk AUTH key. Retrying (${retries}) (${io.stderr})`);
        await refreshWskProps(cred, retries - 1);
    }
}

// Get Wsk AUTH and APIGW_ACCESS_TOKEN for given credential. If cred space does not exist, create it.
export async function getWskPropsForSpace(cred: ICredential) {
    debug('retrieving wsk authentication');
    await ensureSpaceExists(cred);
    return parser.read(wskProps(cred));
}

// Populate props with Bluemix specific authentication
export async function resolveAuth(props, env: string, version: string) {
    if (!isBluemixCapable())
        throw new Error('bx is not installed');

    let bxorg = process.env.BLUEMIX_ORG || props.get('BLUEMIX_ORG');
    if (!bxorg)
        throw new Error('cannot resolve AUTH and APIGW_ACCESS_TOKEN from Bluemix credential: missing BLUEMIX_ORG');

    let bxspace = props.get('BLUEMIX_SPACE');
    bxspace = bxspace ? bxspace.trim() : null;
    if (!bxspace) {
        let projectname = props.get('PROJECT_NAME');
        if (!projectname)
            throw new Error(`cannot resolve AUTH: missing project name.`);

        if (version)
            bxspace = `${projectname}-${env}@${version}`;
        else
            bxspace = `${projectname}-${env}`;

        bxspace = escapeNamespace(bxspace);
        debug(`targeting ${bxspace} space`);
    }

    const cred: ICredential = { org: bxorg, space: bxspace };
    const wskprops = await getWskPropsForSpace(cred);

    if (!wskprops.AUTH)
        throw new Error('missing AUTH in .wskprops');
    if (!wskprops.APIGW_ACCESS_TOKEN)
        throw new Error('missing APIGW_ACCESS_TOKEN in .wskprops');

    props.set('ENVNAME', env);
    if (version)
        props.set('ENVVERSION', version);
    props.set('BLUEMIX_ORG', bxorg);
    props.set('BLUEMIX_SPACE', bxspace);
    props.set('AUTH', wskprops.AUTH);
    props.set('APIGW_ACCESS_TOKEN', wskprops.APIGW_ACCESS_TOKEN);
}

// Prepare backend so that the OpenWhisk client works
export async function initWsk(wskprops: IWskProps) {
    if (wskprops.BLUEMIX_ORG && wskprops.BLUEMIX_SPACE) {
        const cred: ICredential = { org: wskprops.BLUEMIX_ORG, space: wskprops.BLUEMIX_SPACE };
        await ensureSpaceExists(cred);

        // Patch APIGW_ACCESS_TOKEN
        const bxwskprops = parser.read(`${cred.home}/.wskprops`);
        wskprops.APIGW_ACCESS_TOKEN = bxwskprops.APIGW_ACCESS_TOKEN;
    }
}

// Convert env name to valid namespace
function escapeNamespace(str: string) {
    // The first character must be an alphanumeric character, or an underscore.
    // The subsequent characters can be alphanumeric, spaces, or any of the following: _, @, ., -
    return str.replace(/[+]/g, '-');
}
