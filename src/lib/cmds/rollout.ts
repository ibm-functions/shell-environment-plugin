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
import * as docs from './docs';

const usage = `${docs.docRollout}
\trollout enable    [ ${docs.docRolloutEnable} ]
\trollout upgrade   [ ${docs.docRolloutUpgrade} ]
\trollout rollback  [ ${docs.docRolloutRollback} ]`;

const doRollout = async (_1, _2, _3, { errors }, _4, _5, _6, argv) => {
    throw new errors.usage(usage);
};

module.exports = (commandTree, prequire) => {
    commandTree.listen('/rollout', doRollout, { docs: docs.docRollout });

    require('./rollout-enable')(commandTree, prequire);
    require('./rollout-upgrade')(commandTree, prequire);
    require('./rollout-rollback')(commandTree, prequire);
};
