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
import { sliceCmd, error, consume } from './cli';
import { getEnvironments, setCurrentEnvironment, getCurrentEnvironment } from '../store';
import { setEnvironment, ErrorMissingVariable } from '../environment';

declare const wsk;

const usage = {
    title: 'Set the current environment',
    header: '',
    prefix: 'env set',
    example: 'env set <name> [-v|--version <version>]',
    required: [
        { name: 'name', docs: 'the environment name' }
    ],
    optional: [
        { name: '-v|--version', docs: 'the deployment version corresponding to the environment. Default is master' }
    ]
};

const doSet = wsk => async (_1, _2, _3, { ui, errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'set');

    const name = argv._.shift();
    if (!name)
        throw new errors.usage(usage);

    const version = consume(argv, ['v', 'version']) || 'master';

    const envs = getEnvironments();
    if (!envs[name])
        error(errors, `environment ${name} does not exist`);

    const currentEnv = getCurrentEnvironment();
    if (currentEnv && currentEnv.name === name && currentEnv.version === version)
        return true;

    try {
        await setEnvironment(wsk, name, version);
        return true;
    } catch (e) {
        if (e instanceof ErrorMissingVariable)
            return errorMissingVar(e.name);
        throw e;
    }
};

function errorMissingVar(name: string) {
    const div = document.createElement('div');
    div.innerHTML = `<span>missing ${name} in the list of environment variables. Please use <span class='clickable' onclick='repl.partial("env var set ${name} <variable_value&gt;")'>env var set ${name} &lt;variable_value&gt;</span> to set it</span>`;
    return div;
}

module.exports = (commandTree, prequire) => {
    const wsk = prequire('/ui/commands/openwhisk-core');

    commandTree.listen('/env/set', doSet(wsk), { usage });
};
