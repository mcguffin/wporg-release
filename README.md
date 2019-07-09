# wporg-release
Release scripts for wordpress.org

## Install

```
npm install -g github:mcguffin/wporg-release
```

## Setup
### Preconditions
#### Git
 - Required for Git: SSH-Access to your Git-Repositories. Help: [Github](https://help.github.com/en/articles/connecting-to-github-with-ssh), [Bitbucket](https://confluence.atlassian.com/bitbucketserver/ssh-access-keys-for-system-use-776639781.html)
 - For github: an Access Token with `repo`-Scope enabled. [Create one](https://github.com/settings/tokens/new)

#### Wordpress.org
 - An account at WordPress.org. [Create one](https://login.wordpress.org/register)
 - For Plugin-releases: Access to the wordpress plugin repository.
 - On macOS: SVN credentials stored in Keychain. [This might help](https://top-frog.com/2009/03/30/mac-os-x-subversion-and-keychain/)

## The Setup
Run the configuration wizard
```bash
wporg-release setup
```

## Usage


```
$ wp-release
Usage \`wp-release [options]\`

Options can be:
 - setup: Run configuration wizard

Or one of:
 - Version identifiers: patch|minor|major
 - Mode: dry (Don't do anything on remotes)
 - wporg-Options: assets|source releae either only assets or only sourcecode (default: none)

Or any of
 - Release steps: build|git|github|wporg|pack (Default: wporg.steps in package.json)
```

### Examples

Create and distrubute a patch update.
```bash
$ wporg-release patch
```

Create a minor update, but don't release it to any remote yet.
```bash
$ wporg-release build minor // Create a package zip to be submitted to wporg.
```

Release current version to github and wporg.  
```bash
$ wporg-release github wporg // Create a package zip to be submitted to wporg.
```

Create a package zip submittable to wporg. (Will be created on level above your project root)
```bash
$ wporg-release pack
```


```bash
$ wporg-release minor dry // build minor update and simulate the releasing
```

Publish updated assets on wporg
```bash
$ wporg-release wporg assets
```

Publish updated source on wporg
```bash
$ wporg-release wporg source // publish changed assets on wporg
```
