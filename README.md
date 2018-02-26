This plugin helps you manage multiple environments for deploying cloud assets such as cloud functions.

## ⚙ Getting started

This plugin is an extension to the programming [shell](https://github.com/ibm-functions/shell). Follow [these](https://github.com/ibm-functions/shell/blob/master/docs/npm.md) instructions to install it.

Start the shell and  install this plugin by typing this command in the shell:

```
plugin install shell-environment-plugin
```

Reload the shell to activate the plugin.

Alternatively you can install it from a terminal:

```
$ fsh plugin install shell-environment-plugin
```

## Shell commands

```
$ fsh
Welcome to the IBM Cloud Functions Shell

fsh env new                          [ Create a new environment ]
fsh env set                          [ Set the current environment ]
fsh env show                         [ Show information about the current environment ]
fsh env list                         [ List environments ]

fsh env var                          [ Commands related to environment variables ]
fsh env var set                      [ Set the value of a variable in the current environment ]
fsh env var list                     [ List environment variables ]
fsh env var delete                   [ Delete a variable from the current environment ]

fsh rollout enable                   [ Enable rollout deployment for the current environment ]
fsh rollout upgrade                  [ Upgrade the active deployment to the latest version ]
...
```

## Defining a new environment

To create a new environment, call `env new <name>` and configure it to point to an IBM Cloud space by setting the value of these environment variables:

- `BLUEMIX_API_KEY`: the IBM Cloud platform API key for accessing your account
- `BLUEMIX_ENDPOINT`: the IBM Cloud endpoint where to deploy assets
- `BLUEMIX_ORG`: the IBM cloud organization where to deploy assets
- `BLUEMIX_SPACE`: the IBM Cloud space where to deploy assets. This is automatically computed `shell-project-plugin` is activated.

As an example, you can set the IBM Cloud endpoint like this:

```
env var set BLUEMIX_ENDPOINT api.ng.bluemix.net
```

After setting all mandatory variables, you can switch to the new environment by calling `env set <name>`. This command automatically creates a new IBM Cloud space when needed. It also updates `~/.wskprops` so `wsk` commands executed within the shell or outside the shell produce a consistent result.

## Incremental rolling update

By default, deployments are configured to update assets in-place, overriding assets that have been previously deployed. When incremental rolling update is turned on (`fsh rollout enable`), assets are made available to everybody in an incremental way.

The first time incremental rolling update is enabled, two additional IBM cloud spaces are being created:

![Initial Rolling Update](doc/rolling-update/rolling-update.001.png?raw=true)

The `active` deployment contains assets available to everyone. Initially these assets are identical to the ones in the deployments tagged `v0.0.1` and `master`.

Further deployments are always done in the `master` deployment, without altering assets in the `active` deploymnents. When you want to release a new version to everyone, use the command `fsh upgrade` which:
- creates a new tagged deployment containing assets in `master`
- and switches the `active` deployment to reflect the new assets

For instance, here how it looks after running `fsh update --minor`:

![Deployment after upgrade](doc/rolling-update/rolling-update.002.png?raw=true)

### Cost impact

Currently, rolling update is implemented by forwarding incoming requests on `active` to one of the tagged deployments (e.g `v0.1.0`). Since these assets belong to two different namespaces, each activation is double-billed.

### Rolling back

In case the upgrade to a new version didn't work as planned, use `fsh rollout rollback` to reactivates the previous deployment.

## Learning about environments

An *environment* consists of
- a unique name
- a set of policies governing command defaults,
- and a set of *environment variables*, including the environment name and the OpenWhisk configuration variables such as `AUTH` and `APIHOST`. See below for more details.

The environment variables are input parameters to the deployment commands. For instance, when the `shell-project-plugin` is used, `project deploy` runs `wskdeploy` with the variables defined in the current environment. The environment variables can also be referenced directly in the shell, e.g. `wsk action update action-$ACTIONAME action.js`.

### Policies

*Policies* define command default bevahiors. These policies are:
- `rolling-update`: govern rolling upgrade. Possible values are `off` and `incremental`

### Mandatory environment variables

Here are the list of variable bindings you must define:

- `BLUEMIX_API_KEY`: the IBM Cloud platform API key for accessing your account
- `BLUEMIX_ENDPOINT`: the IBM Cloud endpoint
- `BLUEMIX_ORG`: the IBM cloud organization

### Computed variables

This plugin manages several variables for you. Here the list of variable bindings that are automatically determined:

- `ENVNAME`: the environment name (see above).
- `APIHOST`: the OpenWhisk API host
- `APIVERSION`: the OpenWhisk API version. Always `v1`
- `NAMESPACE`: the OpenWhisk namespace associated to `AUTH`. `guest` for local OpenWhisk, otherwise determined from the IBM cloud organization and space.
- `IGNORE_CERTS`: whether to ignore certificates. true for local OpenWhisk, otherwise false.
- `APIGW_ACCESS_TOKEN`: the OpenWhisk API gateway token. `true` for local OpenWhisk. Otherwise computed from the current Bluemix target.

In addition, these variables are available for managed projects:

- `PROJECTNAME`: the associated project name coming from the project property `name`.
- `AUTH`: the OpenWhisk authentication token. `auth.guest` for local OpenWhisk, otherwise determined from the IBM cloud target.
- `BLUEMIX_SPACE`: the IBM Cloud space name of the form `<PROJECTNAME>-<ENVNAME>[@<VERSION>]`.
