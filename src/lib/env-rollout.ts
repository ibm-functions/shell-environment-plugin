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
import { error, sliceCmd, checkExtraneous, consume } from './cli';
import { docRollout } from './docs';
import { getCurrentEnvironmentOrError } from './store';
import { enableBluegreen } from './rolling';

const usage = `${docRollout}

\tenv rollout [--bluegreen]

Optional parameters:
\t--bluegreen               set deployment policy to blue/green`;

const doRollout = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'rollout');

    const bluegreen = consume(argv, ['bluegreen']);

    const env = getCurrentEnvironmentOrError(errors);
    if (bluegreen) {
        await enableBluegreen(env);
    }

    return true;
};

module.exports = (commandTree, _) => {
    commandTree.listen('/env/rollout', doRollout, { docs: docRollout });
};
