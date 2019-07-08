# wporg-release
Release scripts for wordpress.org

## Install

```
npm install github:mcguffin/wporg-release
```



## Configure
In `package.json`:
```json
...,
"wporg-release": {
	"credentials":{
		"wpsvn_password":"security find-generic-password -s \"<https://plugins.svn.wordpress.org:443> Use your WordPress.org login\" -a ${nickname} -w`",
		"github_password":"security find-generic-password -a ${whoami} -s GithubAccessToken -w",
		"bitbucket":""
	},
	"build": [
		"gulp build",
	],
	"release":[
		"github",
		"wporg"
	]
},
...
```

`credentials`: cli-commands that return your

In MacOS Keychain

## Use

Release a minor
```
wp-release
```
