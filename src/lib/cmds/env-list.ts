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
import { sliceCmd } from './cli';
import { getEnvironments, IEnvironments } from '../store';
import { prettyRollingUpdate } from '../rolling';

declare const repl;

const usage = {
    title: 'List environments',
    header: '',
    prefix: 'env list',
    example: 'env list'
};

const doList = cmd => async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, cmd);

    const envs = getEnvironments();
    return formatForShell(envs);
};

function formatForShell(envs: IEnvironments) {
    return Object.keys(envs).map(k => {
        const v = envs[k];
        return {
            name: v.name,
            type: 'env',
            onclick: () => repl.pexec(`env set ${k}`),
            attributes: [
                {
                    value: document.createTextNode(v.rolling ? prettyRollingUpdate[v.rolling.kind] : 'direct'),
                    css: 'green-text'
                }]
        };
    });
}

module.exports = (commandTree, require) => {
    const cmd = commandTree.listen('/env/list', doList('list'), { usage });
    commandTree.synonym('/env/ls', doList('ls'), cmd);
};
