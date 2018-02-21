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

import {
    Client, Dict, Limits, Action, Actions, Desc, Activations, Namespaces, Packages, Rules, Triggers,
    Feeds, Routes, Activation, Response, Package, PackageDesc, ActivationDesc
} from "openwhisk";
import { BaseActions, BaseActivations, BasePackages } from "./base-client";

/* Namespace-level rolling update OpenWhisk client support. */
export class NamespaceRolling implements Client {
    actions: Actions;
    activations: Activations;
    namespaces: Namespaces;
    packages: Packages;
    rules: Rules;
    triggers: Triggers;
    feeds: Feeds;
    routes: Routes;

    constructor(client: Client, current: Client) {
        this.actions = new NSActions(client, current);
        this.activations = new BaseActivations(client);
        this.packages = new NSPackages(client, current);
    }
}

class NSActions extends BaseActions {
    constructor(client: Client, protected current: Client) {
        super(client);
    }

    create(options: { name: string; namespace?: string; action: string | Action | Buffer; kind?: "" | "nodejs:default" | "nodejs:6" | "python:default" | "python:3" | "python:2" | "swift:default" | "swift:3.1.1" | "php:default" | "php:7.1"; overwrite?: boolean; params?: Dict; annotations?: Dict; limits?: Limits; version?: string; }): Promise<Action> {
        return this.current.actions.create(options);
    }

    update(options: { name: string; namespace?: string; action: string | Action | Buffer; kind?: "" | "nodejs:default" | "nodejs:6" | "python:default" | "python:3" | "python:2" | "swift:default" | "swift:3.1.1" | "php:default" | "php:7.1"; params?: Dict; annotations?: Dict; limits?: Limits; version?: string; }): Promise<Action> {
        return this.current.actions.update(options);
    }

    delete(options: any): any {
        // TODO
        return this.client.actions.delete(options);
    }
}

class NSPackages extends BasePackages {
    constructor(client: Client, protected current: Client) {
        super(client);
    }

    create(options: { name: string; namespace?: string; package?: Package; overwrite?: boolean; }): Promise<Package> {
        return this.current.packages.create(options);
    }

    update(options: { name: string; namespace?: string; package?: Package; }): Promise<Package> {
        return this.current.packages.update(options);
    }

    delete(options: string): Promise<Package>;
    delete(options: { name: string; namespace?: string; }): Promise<Package>;
    delete(options: (string | { name: string; namespace?: string; })[]): Promise<Package[]>;
    delete(options: any): any {
        // TODO
        return this.client.packages.delete(options);
    }
}
