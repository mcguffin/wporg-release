#!/usr/bin/env node
const release = require('./lib/release/index.js');
const [ , , ...args ] = process.argv;

const identifier =  ['major','minor','patch'].indexOf( args[ args.length - 1 ]) !== -1
	? args[ args.length - 1 ]
	: 'patch';

const dry = args.indexOf('dry') !== -1;

/*
wp-release
	wp-release patch
wp-release setup
	Setup
*/

(async () => {
	if ( args.indexOf('setup') !== -1 ) {
		console.log('## BUILD ##')
		await release.setup( identifier )
	}
	if ( args.indexOf('build') !== -1 ) {
		console.log('## BUILD ##')
		await release.build( identifier )
	}
	if ( args.indexOf('github') !== -1 ) {
		console.log('## GITHUB ##')
		await release.github(dry)
	}
	if ( args.indexOf('bitbucket') !== -1 ) {
		console.log('## BITBUCKET ##')
		await release.bitbucket(dry)
	}
	if ( args.indexOf('wporg') !== -1 ) {
		console.log('## WPORG ##')
		await release.wporg(dry)
	}
})();
