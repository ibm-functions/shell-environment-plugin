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

// CLI Helpers

export function error(errors, msg: string, usage = '') {
    throw new errors.usage(`${msg}${usage ? '\n\n' : ''}${usage}`);
}

export function consume(argv, options: string[]) {
    return options.reduce((value, option) => {
        const v = argv[option];
        delete argv[option];
        return value || v;
    }, undefined);
}

export function checkExtraneous(modules, argv) {
    if (argv._.length !== 0)
        throw new modules.errors.usage(`Extraneous argument(s): ${argv._.join(', ')}`);
}

export function checkExtraneousFlags(modules, argv) {
    delete argv._;
    if (Object.keys(argv).length !== 0)
        throw new modules.errors.usage(`Extraneous flags(s): ${Object.keys(argv).join(', ')}`);
}

export function sliceCmd(argv, cmd) {
    argv._ = argv._.slice(argv._.indexOf(cmd) + 1);
}

export async function delay(ms) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
}
