
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
import { error, sliceCmd, checkExtraneous, consume, getCurrentEnvironmentOrError } from './cli';
import { docRolloutEnable } from './docs';
import { enableBluegreen } from '../environment';

const usage = docRolloutEnable;
// `${docRolloutEnable}

// \trollout enable [--bluegreen]

// Optional parameters:
// \t--bluegreen               set deployment policy to blue/green`;

const doRolloutEnable = wsk =>  async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    if (argv.help)
        throw new errors.usage(usage);

    sliceCmd(argv, 'enable');

    // const bluegreen = consume(argv, ['bluegreen']);

    const env = getCurrentEnvironmentOrError(errors);
    // if (bluegreen) {
    await enableBluegreen(wsk, env);
    // }

    return true;
};

module.exports = (commandTree, prequire) => {
    const wsk = prequire('/ui/commands/openwhisk-core');
    commandTree.listen('/rollout/enable', doRolloutEnable(wsk), { docs: docRolloutEnable });
};
