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
import { getEnvironments, setCurrentEnvironment } from './store';

declare const repl: any;

let wsk;

const usage = `${docSet}

\tenv set <env>

Required parameters:
\tenv            the environment name (e.g. dev, prod)`;

const doSet = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'set');

    const name = argv._.shift();
    if (!name)
        throw new errors.usage(`expected environment name.\n\n${usage}`);
    const envs = getEnvironments();
    if (!envs[name])
        error(errors, `environment ${name} does not exist`);

    setCurrentEnvironment(name);
    return true;
};

module.exports = (commandTree, require) => {
    commandTree.listen('/env/set', doSet, { docs: docSet });
};
