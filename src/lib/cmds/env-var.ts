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
import * as docs from './docs';

const usage = `${docs.docVar}
\tenv var set                      [ ${docs.docVarSet} ]
\tenv var list                     [ ${docs.docVarList} ]
\tenv var delete                   [ ${docs.docVarDelete} ]`;

const doVar = async (_1, _2, _3, modules, _4, _5, _6, argv) => {
    throw new modules.errors.usage(usage);
};

module.exports = (commandTree, prequire) => {
    commandTree.listen('/env/var', doVar, { docs: docs.docVar });

    require('./env-var-set')(commandTree, prequire);
    require('./env-var-list')(commandTree, prequire);
    require('./env-var-delete')(commandTree, prequire);
};