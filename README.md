This plugin helps you manage multiple deployment environments.

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

### Creating new environment

You can create new environment for your project by using the `env new` command.

```
$ fsh env new <env>
```

This creates an environment named `env`.

### Listing environments

You can use the command `env list` to print a summary of available environments.

```
$ fsh env list
```

### Setting the current environment

```
$ fsh env set <env>
```

### Getting information about the current environment

To get details about the current environment, use the command `env show`.

```
$ fsh env show
```

### Getting information about the current environment

To get details about the current environment, use the command `env show`.

```
$ fsh env show
```

### Setting an environment variable value

Use the following command to set or add a variable in the current environment:

```
$ fsh env var set <var> <value>
```

Currently environment variables are persisted within the IBM Cloud Shell.

### Listing all environment variables

```
$ fsh env var list
```

## Learning about environments

An *environment* consists of a set of configuration parameters used to instantiate project templates. For instance, the `dev` environment might use a Cloudant database named `database-dev`, whereas the `prod` environment might certainly use a different database named `database-prod`. This can be accomplished by adding the expression `database-${envname}` in the project template.

Most specifically, each environment is characterized by:
- a unique name which can be used in interpolation,
- a set of policies governing command defaults,
- and a set of environment variables, including OpenWhisk configuration variables such as `AUTH` and `APIHOST`.

### Environment name

The environment *name* is exposed within project configuration as a parameter.

### Policies

*Policies* are attached to environments in order to define default command bevahiors. These policies are:
- `writable`: dictate which deployment mode to use when *deploying* projects.
- `promote`: list of environment names this environment promotes to.

### Environment variables

All variables are accessible within interpolation.

### Mandatory variables

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
