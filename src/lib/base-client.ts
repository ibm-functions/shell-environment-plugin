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

export class BaseActions implements Actions {
    constructor(protected client: Client) {
    }

    list(options?: { namespace?: string; skip?: number; limit?: number; }): Promise<Desc[]> {
        return this.client.actions.list(options);
    }

    get(options: string): Promise<Action>;
    get(options: { name: string; namespace?: string }): Promise<Action>;
    get(options: (string | { name: string; namespace?: string })[]): Promise<Action[]>;
    get(options: any): any {
        return this.client.actions.get(options);
    }

    invoke(options: any): any {
        return this.client.actions.invoke(options);
    }

    create(options: { name: string; namespace?: string; action: string | Action | Buffer; kind?: "" | "nodejs:default" | "nodejs:6" | "python:default" | "python:3" | "python:2" | "swift:default" | "swift:3.1.1" | "php:default" | "php:7.1"; overwrite?: boolean; params?: Dict; annotations?: Dict; limits?: Limits; version?: string; }): Promise<Action> {
        return this.client.actions.create(options);
    }

    update(options: { name: string; namespace?: string; action: string | Action | Buffer; kind?: "" | "nodejs:default" | "nodejs:6" | "python:default" | "python:3" | "python:2" | "swift:default" | "swift:3.1.1" | "php:default" | "php:7.1"; params?: Dict; annotations?: Dict; limits?: Limits; version?: string; }): Promise<Action> {
        return this.client.actions.update(options);
    }

    delete(options: any): any {
        return this.client.actions.delete(options);
    }
}

export class BaseActivations implements Activations {
    constructor(protected client: Client) {
    }

    list(options?: { namespace?: string; name?: string; skip?: number; limit?: number; upto?: number; docs?: boolean; since?: number; }): Promise<ActivationDesc[]> {
        return this.client.activations.list(options);
    }

    get<T extends Dict>(options: string): Promise<Activation<T>>;
    get<T extends Dict>(options: { name: string; namespace?: string; }): Promise<Activation<T>>;
    get(options: string): Promise<Activation<Dict>>;
    get(options: { name: string; namespace?: string; }): Promise<Activation<Dict>>;
    get(options: any) {
        return this.client.activations.get(options);
    }

    // tslint:disable-next-line:ban-types
    logs(options: { name: string; namespace?: string; }): Promise<{ logs: String[]; }> {
        return this.client.activations.logs(options);
    }

    result<T extends Dict>(options: { name: string; namespace?: string; }): Promise<Response<T>>;
    result(options: { name: string; namespace?: string; }): Promise<Response<Dict>>;
    result(options: any) {
        return this.client.activations.result(options);
    }
}

export class BasePackages implements Packages {
    constructor(protected client: Client) {
    }

    list(options?: { namespace?: string; skip?: number; limit?: number; public?: boolean; }): Promise<PackageDesc[]> {
        return this.client.packages.list(options);
    }

    get(options: string): Promise<Package>;
    get(options: { name: string; namespace?: string; }): Promise<Package>;
    get(options: (string | { name: string; namespace?: string; })[]): Promise<Package[]>;
    get(options: any): any {
        return this.client.packages.get(options);
    }

    create(options: { name: string; namespace?: string; package?: Package; overwrite?: boolean; }): Promise<Package> {
        return this.client.packages.create(options);
    }

    update(options: { name: string; namespace?: string; package?: Package; }): Promise<Package> {
        return this.client.packages.update(options);
    }

    delete(options: string): Promise<Package>;
    delete(options: { name: string; namespace?: string; }): Promise<Package>;
    delete(options: (string | { name: string; namespace?: string; })[]): Promise<Package[]>;
    delete(options: any): any {
        return this.client.packages.delete(options);
    }
}
