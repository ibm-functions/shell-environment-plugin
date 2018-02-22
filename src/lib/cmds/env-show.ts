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
import * as fs from 'fs-extra';
import * as env from './env';
import { docShow } from './docs';
import { sliceCmd } from './cli';
import { getCurrentEnvironment, IEnvironment } from '../store';

const usage = docShow;

const doShow = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'show');

    const env = getCurrentEnvironment();
    if (env) {
        return formatForShell(env);
    }
    return 'current environment not set';
};

function formatForShell(env: IEnvironment) {
    const variables = env.variables;
    if (variables && Object.keys(variables).length > 0) {
        return Object.keys(variables).map(name => {
            const v = variables[name];
            return {
                name,
                type: 'variable',
                attributes: [
                    {
                        value: document.createTextNode(v.value),
                        css: ''
                    }]
            };
        });
    }
    return `environment is empty`;
}

module.exports = (commandTree, require) => {
    commandTree.listen('/env/show', doShow, { docs: docShow });
};
