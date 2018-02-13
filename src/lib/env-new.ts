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
import { error, sliceCmd, checkExtraneous } from './cli';
import { docNew } from './docs';
import { newEnvironment, StoreKind } from './store';

const usage = `${docNew}

\tenv new <env>

Required parameters:
\t<env>               the environment name`;

const doNew = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'new');

    const name: string = argv._.shift();
    if (!name)
        error(errors, 'missing environment name');

    newEnvironment(name, StoreKind.LOCAL);
    return `environment ${name} created.`;
};

module.exports = (commandTree, _) => {
    commandTree.listen('/env/new', doNew, { docs: docNew });
};
