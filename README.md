# wp-release
Release scripts for wordpress.org, github etc.

## Install

```
npm install -g github:mcguffin/wporg-release
```

## Setup

### System Dependencies

 - [npm](https://www.npmjs.com/)
 - [WP-CLI](https://wp-cli.org/)

### Preconditions
#### Git
 - Required for Git: SSH-Access to your Git-Repositories.  
 Vulgo: Your repo remote must be something like `git@some-host:some-user/some-repo.git`  
 More help: [Github](https://help.github.com/en/articles/connecting-to-github-with-ssh), [Bitbucket](https://confluence.atlassian.com/bitbucketserver/ssh-access-keys-for-system-use-776639781.html)

#### Github
 - an Access Token with `repo`-Scope enabled. [Create one](https://github.com/settings/tokens/new)

#### Wordpress.org
 - An account at WordPress.org. [Create one](https://login.wordpress.org/register)
 - For Plugin-releases: Access to the wordpress plugin repository.
 - The only way to relese a Theme-Update is by using a carbon based system (you) under [this url](https://wordpress.org/themes/upload/).



## Setup
Run the configuration wizard inside your plugin or theme directory
```bash
wp-release setup
```



## Usage
```
$ wp-release
Usage `wp-release [steps] [options]`

[steps]
If step is not specified all steps are taken.
 - `setup` set up repository. Run this before anything else.
 - `build` build release from current sources.
 - `git` create a git tag from current version and push it to remote
 - `github` create a release on github
 - `wporg` create a (plugin-)release on wporg. 
 - `pack` create installer package

[options]
options 
 - `patch`, `minor`, `major`. Version identifier, use with `build`.
   Omit to just build without changing version
 - `assets`, `source` publish either only assets or source. Use with `wporg`
 - `dry`: don't publish anything, just simulate. Use with `git`, `github` 
   and `wporg`
```

### Examples

Create and distribute a patch update.
```bash
$ wp-release patch
```

Create a minor update, but don't release it to any remote yet.
```bash
$ wp-release build minor
```

Release current version to github and wporg.  
```bash
$ wp-release github wporg
```

Create a package zip submittable to wporg. (Will be created on level above project root)
```bash
$ wp-release pack
```

build minor update and simulate release process
```bash
$ wp-release minor dry
```

Update trunk on wporg. Create release, if versions aren't equal
```bash
$ wp-release wporg
```

Publish updated assets on wporg
```bash
$ wp-release wporg assets
```

Publish updated source on wporg
```bash
$ wp-release wporg source
```
