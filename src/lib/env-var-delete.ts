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
import { docVarDelete } from './docs';
import { sliceCmd, error } from './cli';
import { persistEnvironment, getCurrentEnvironment } from './store';
import { deleteVar } from './environment';

const usage = `${docVarDelete}

\tenv var delete <variable_name>`;

const doVarDelete = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'delete');

    const name = argv._.shift();
    if (!name)
        error(errors, 'missing variable name', usage);

    const env = getCurrentEnvironment();
    if (!env)
        error(errors, 'current environment not set');

    deleteVar(env, name);
    return true;
};

module.exports = (commandTree, require) => {
    commandTree.listen('/env/var/delete', doVarDelete, { docs: docVarDelete });
};
