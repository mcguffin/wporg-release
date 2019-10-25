# wp-release
Release scripts for wordpress.org

## Install

```
npm install -g github:mcguffin/wporg-release
```

## Setup
### Preconditions
#### Git
 - Required for Git: SSH-Access to your Git-Repositories.  
 Vulgo: Your repo remote must be something like `git@some-host:some-user/some-repo.git`  
 More help: [Github](https://help.github.com/en/articles/connecting-to-github-with-ssh), [Bitbucket](https://confluence.atlassian.com/bitbucketserver/ssh-access-keys-for-system-use-776639781.html)

### Github
 - an Access Token with `repo`-Scope enabled. [Create one](https://github.com/settings/tokens/new)

#### Wordpress.org
 - An account at WordPress.org. [Create one](https://login.wordpress.org/register)
 - For Plugin-releases: Access to the wordpress plugin repository.
 - On macOS: SVN credentials stored in Keychain. [This article might help](https://top-frog.com/2009/03/30/mac-os-x-subversion-and-keychain/)
 - The only way to relese a Theme-Update is by using a carbon based system (you) under [this url](https://wordpress.org/themes/upload/).

## The Setup
Run the configuration wizard
```bash
wp-release setup
```

## Usage


```
$ wp-release
Usage `wp-release [options]`

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
$ wp-release patch
```

Create a minor update, but don't release it to any remote yet.
```bash
$ wp-release build minor // Create a package zip to be submitted to wporg.
```

Release current version to github and wporg.  
```bash
$ wp-release github wporg // Create a package zip to be submitted to wporg.
```

Create a package zip submittable to wporg. (Will be created on level above your project root)
```bash
$ wp-release pack
```


```bash
$ wp-release minor dry // build minor update and simulate the releasing
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
$ wp-release wporg source // publish changed assets on wporg
```
