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
import { syncEnvName } from './lib/ui';
import { getCurrentEnvironment } from './lib/store';
import { setEnvironment } from './lib/environment';

// preloading hook.
function init(commandTree, prequire) {
    if (typeof document === 'undefined') return;

    const ns = document.getElementById('openwhisk-namespace');
    if (ns) {
        ns.setAttribute('title', 'Your environment name and deployment version. Click to change to another environment');
        ns.setAttribute('onclick', 'repl.partial("env set <your_env_name>")');
    }

    // syncEnvName();
    const current = getCurrentEnvironment();
    if (current && current.name) {
        try {
            const wsk = prequire('/ui/commands/openwhisk-core');
            setEnvironment(wsk, current.name, current.version || 'latest');
        } catch (e) {
            throw e;
        }
    }
}

module.exports = (commandTree, prequire) => {
    require('./lib/env')(commandTree, prequire);
    require('./lib/env-list')(commandTree, prequire);
    require('./lib/env-set')(commandTree, prequire);
    require('./lib/env-show')(commandTree, prequire);
    require('./lib/env-new')(commandTree, prequire);
    require('./lib/env-rollout')(commandTree, prequire);

    init(commandTree, prequire);

    return {
        current: getCurrentEnvironment
    };
};
