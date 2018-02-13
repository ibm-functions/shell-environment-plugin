# Introduction to Serverless Project Management

This plugin helps you manage multiple environments.

## ⚙ Getting started

This plugin is an extension to the programming [shell](https://github.com/ibm-functions/shell). Follow [these](https://github.com/ibm-functions/shell/blob/master/docs/npm.md) instructions to install it.

Start the shell and  install this plugin by typing this command in the shell:

```
plugin install shell-environment-plugin
```

The reload the shell to activate the plugin.

Alternatively you can install it from a terminal:

```
$ fsh plugin install shell-environment-plugin
```

## Shell commands

```
$ fsh
Welcome to the IBM Cloud Functions Shell

fsh env list
fsh env show
fsh env set <env>
fsh env new <env>

...
```

### Creating new environment

The shell supports a couple of builtin environments, namely `dev` and `prod`. You can create new environment for your project by using the `env new` command.

```
$ fsh env new <env> ```

This creates an environment named `env`.

### Listing environments and associated tags

You can use the command `env list` to know which builtin and custom environments are defined for your project.

```
$ fsh env list
```

### Setting the current environment

```
$ fsh env set <env>
```

### Getting information about the current environment

To know the value of the current environment and to print information associated to it, you can use `env show`.

```
$ fsh env show
```

## Learning about environments

An *environment* binds project configuration templates to actual parameter values. For instance, the `dev` environment might use a Cloudant database named `database-dev`, whereas the `prod` environment might certainly use a different database named `database-prod`. This can be accomplished by adding the expression `database-${envname}` in the project configuration.

Most specifically, each environment is characterized by:
- a unique name which can be used in interpolation,
- a set of policies governing command defaults,
- and a set of variable bindings, including OpenWhisk configuration variables such as `AUTH` and `APIHOST`.

### Environment name

The environment *name* is exposed within project configuration as a parameter. See [interpolation](https://github.com/lionelvillard/openwhisk-project/blob/master/docs/format.md#interpolation) for more details.

### Policies

*Policies* are attached to environments in order to define default command bevahiors. These policies are:
- `writable`: dictate which deployment mode to use when *deploying* projects. (`true` for `update`, `false` for `create`).
- `promote`: list of environment names this environment promotes to.

### Variable bindings

Variable bindings, i.e. variable name and value pairs, are for the moment stored in `.<envname>.wskprops` files. For convenience, variable bindings shared across all environments can be added to the file named `.all.wskprops`. Variable bindings stored in `.<envname>.wskprops` take priorities over the ones in `.all.wskprops`.

All variables are accessible within interpolation under the `vars` global property. See [interpolation](https://github.com/lionelvillard/openwhisk-project/blob/master/docs/format.md#interpolation) for more details.

Note that variable names are case-insentive, eg. both `ENVNAME` and `EnvName` resolve to the same value.

### Reserved variable bindings

This plugin manages several variables for you. Here the list of variable bindings that are automatically determined:
- `ENVNAME`: the environment name (see above).
- `PROJECTNAME`: the associated project name coming from the project property `name`.
- `APIGW_ACCESS_TOKEN`: the OpenWhisk API gateway token. `true` for local OpenWhisk. Otherwise computed from the current Bluemix target.
- `APIVERSION`: the OpenWhisk API version. Always `v1`
- `AUTH`: the OpenWhisk authentication token. `auth.guest` for local OpenWhisk, otherwise determined from the IBM cloud organization and space.
- `BLUEMIX_SPACE`: the IBM Cloud space name of the form `<PROJECTNAME>-<ENVNAME>[@<VERSION>]`.
- `NAMESPACE`: the OpenWhisk namespace associated to `AUTH`. `guest` for local OpenWhisk, otherwise determined from the IBM cloud organization and space.
- `IGNORE_CERTS`: whether to ignore certificates. true for local OpenWhisk, otherwise false.

Here are the list of variable bindings you can define:

- `APIHOST`: the OpenWhisk API host. By default `openwhisk.ng.bluemix.net`
- `BLUEMIX_ORG`: the IBM cloud organization. If not defined, try to use the process environment variable of the same name.