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
import { docSet } from './docs';
import { sliceCmd, error } from './cli';
import { getEnvironments, setCurrentEnvironment, getCurrentEnvironment } from './store';
import { syncEnvName } from './ui';
import { prepareWskprops, ErrorMissingVariable } from './bluemix';

declare const repl: any;

let wsk;

const usage = `${docSet}

\tenv set <env>

Required parameters:
\tenv            the environment name (e.g. dev, prod)`;

const doSet = prequire => async (_1, _2, _3, { ui, errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'set');

    const name = argv._.shift();
    if (!name)
        throw new errors.usage(`expected environment name.\n\n${usage}`);

    const envs = getEnvironments();
    if (!envs[name])
        error(errors, `environment ${name} does not exist`);

    const currentEnv = getCurrentEnvironment();
    if (currentEnv && currentEnv.name === name)
        return true;

    setCurrentEnvironment(name);
    syncEnvName();

    let project;
    try {
        project = prequire('shell-project-plugin');
    } catch (e) {
        // no project, fine
    }

    // update wskprops.
    try {
        let projname;
        if (project) {
            const cproj = project.current();
            projname = cproj ? cproj.name : null;
        }
        const wsk = prequire('/ui/commands/openwhisk-core');
        await prepareWskprops(wsk, ui.userDataDir(), envs[name], projname);
    } catch (e) {
        if (e instanceof ErrorMissingVariable)
            return errorMissingVar(e.name);
        throw e;
    }

    return true;
};

function errorMissingVar(name: string) {
    const div = document.createElement('div');
    div.innerHTML = `<span>missing ${name} in the list of environment variables. Please use <span class='clickable' onclick='repl.partial("env var set ${name} <variable_value&gt;")'>env var set ${name} &lt;variable_value&gt;</span> to set it</span>`;
    return div;
}

module.exports = (commandTree, prequire) => {
    commandTree.listen('/env/set', doSet(prequire), { docs: docSet });
};
