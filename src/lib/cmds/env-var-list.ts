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
import { getCurrentEnvironmentOrError, sliceCmd, error } from './cli';
import { IEnvironment } from '../store';

const usage = {
    title: 'List environment variables',
    header: '',
    prefix: 'env var list',
    example: 'env var list'
};

const doVarList = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'list');
    const env = getCurrentEnvironmentOrError(errors);
    if (!env.variables)
        return 'environment is empty';

    return formatForShell(env);
};

function formatForShell(env: IEnvironment) {
    const vars = env.variables;
    return Object.keys(vars).map(k => {
        const v = vars[k];
        return {
            name: k, type: 'var', attributes: [
                {
                    value: document.createTextNode(v.issecret ? '[secret]' : v.value),
                    css: 'green-text'
                }]
        };
    });
}

module.exports = (commandTree, require) => {
    commandTree.listen('/env/var/list', doVarList, { usage });
};
