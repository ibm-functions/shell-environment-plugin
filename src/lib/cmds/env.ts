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

const usage = {
    title: 'Environment management operations',
    header: 'These commands will help you manage multiple deployment environments',
    example: 'env <command>',
    commandPrefix: 'env',
    available: [
        { command: 'new', docs: 'Create a new environment' },
        { command: 'set', docs: 'Set the current environment' },
        { command: 'show', docs: 'Show information about the current environment' },
        { command: 'list', docs: 'List environments' },
        { command: 'var', docs: 'Environment variable management operations' },
        { command: 'rollout', docs: 'Environment rollout operations' }
    ],
    related: []
};

const usageVars = {
    title: 'Environment variable management operations',
    header: 'These commands will help you manage environment variables',
    example: 'env var <command>',
    commandPrefix: 'env var',
    available: [
        { command: 'set', docs: 'Set the value of a variable in the current environment' },
        { command: 'delete', docs: 'Delete a variable from the current environment' },
        { command: 'list', docs: 'List environment variables' }
    ],
    related: []
};

const usageRollout = {
    title: 'Environment rollout operations',
    header: 'These commands will help you rollout new version of your assets',
    example: 'env rollout <command>',
    commandPrefix: 'env rollout',
    available: [
        { command: 'enable', docs: 'Enable rollout deployment for the current environment' },
        { command: 'upgrade', docs: 'Upgrade active deployment to latest version' },
        { command: 'rollback', docs: 'Rollback to previously deployed version' }
    ],
    related: []
};

module.exports = (commandTree, prequire) => {
    commandTree.subtree('/env', { usage });

    require('./env-list')(commandTree, prequire);
    require('./env-set')(commandTree, prequire);
    require('./env-show')(commandTree, prequire);
    require('./env-new')(commandTree, prequire);

    commandTree.subtree('/env/var', { usage: usageVars });

    require('./env-var-set')(commandTree, prequire);
    require('./env-var-list')(commandTree, prequire);
    require('./env-var-delete')(commandTree, prequire);

    commandTree.subtree('/env/rollout', { usage: usageRollout });

    require('./rollout-enable')(commandTree, prequire);
    require('./rollout-upgrade')(commandTree, prequire);
    require('./rollout-rollback')(commandTree, prequire);
};
