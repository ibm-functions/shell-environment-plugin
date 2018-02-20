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
...
```

## Defining a new environment

To create a new environment, call `env new <name>` and configure it by setting the value of the mandatory environment variables:

- `BLUEMIX_API_KEY`: the IBM Cloud platform API key for accessing your account
- `BLUEMIX_ENDPOINT`: the IBM Cloud endpoint where to deploy assets
- `BLUEMIX_ORG`: the IBM cloud organization where to deploy assets
- `BLUEMIX_SPACE`: the IBM Cloud space where to deploy assets. This is automatically computed when you are using `shell-project-plugin`.

As an example, you can set the IBM Cloud endpoint like this

```
env var set BLUEMIX_ENDPOINT api.ng.bluemix.net
```

After setting all mandatory variables, you can switch to the new environment by calling `env set <name>`. This command automatically creates a new IBM Cloud space when needed. It also updates `~/.wskprops` so `wsk` commands executed within the shell or outside the shell produce a consistent result.

## Learning about environments

An *environment* consists of
- a unique name
- a set of policies governing command defaults,
- and a set of *environment variables*, including the environment name and the OpenWhisk configuration variables such as `AUTH` and `APIHOST`. See below for more details.

The environment variables are input parameters to the deployment commands. For instance, when the `shell-project-plugin` is used, `project deploy` runs `wskdeploy` with the variables defined in the current environment. The environment variables can also be referenced directly in the shell, e.g. `wsk action update action-$ACTIONAME action.js`.

### Policies

*Policies* define default command bevahiors. These policies are:
- `writable`: dictate which deployment mode to use when *deploying* projects.
- `promote`: list of environment names this environment promotes to.

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
