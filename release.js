#!/usr/bin/env node
const colors =require('colors');
const release = require('./lib/release/index.js');
const setup = require('./lib/setup.js');
const { erase, cursor } = require('sisteransi');

const [ , , ...args ] = process.argv;
const dry = args.indexOf('dry') !== -1;

const usage = `Usage \`wp-release [options]\`

Options can be:
 - setup: Run configuration wizard

Or one of:
 - version identifier: patch|minor|major
 - Mode flag: dry (Don't do anything on remotes)
 - wporg-option: assets|source either release only assets or only sourcecode (default: none)

Or any of
 - Release step: build|git|github|wporg|pack (Default: wporg.steps in package.json)


Examples:
$ wporg-release patch // Create patch update and release it everywhere
$ wporg-release pack // Create a package zip to be submitted to wporg.
$ wporg-release minor // release minor update
$ wporg-release minor dry // build minor update, but keep changes local
$ wporg-release wporg assets // push new assets to wporg

`;

/*

*/

(async () => {
	const package_path = process.cwd() + '/package.json';
	let package;
	try {
		package = require( package_path );
	} catch ( err ) {
		console.error('ERROR'.red,`package.json does not exist`.white)
		process.exit(1)
	}
	const steps = ['build','github','git','wporg','pack','post']
	let has_step_args = false;
	let dry = args.indexOf('dry') !== -1;

	const run_steps = async (...steps) => {
		let i, step;
		for ( i=0;i<steps.length;i++) {
			step = steps[i];
			console.log( `Step: ${step}`.white.bold );
			try {
				await release[step].run( dry );
			} catch (error) {
				console.log('ERROR'.red)
				console.error( error );
//				!!error && console.log(error.red)
				process.exit(1)
			}
		}
	}

	// show some help
	if ( ! args.length || args.indexOf('?') !== -1 ) {
		console.log( usage )
		process.exit(0)
	}


	if ( args.indexOf('setup') !== -1 ) {
		await setup()
		process.exit(0)
	}
	if ( ! package.wporg ) {
		console.log( 'wporg release not configured. Please run `wp-release setup` first'.red )
		process.exit(1)
	}
	let stepargs = steps.filter( step => args.indexOf( step ) !== -1 )
	if ( stepargs.length ) {
		run_steps( ...stepargs )
	} else {
		run_steps( ...package.wporg.steps )
	}
	//
	// if ( args.indexOf('build') !== -1 ) {
	// 	console.log('## BUILD ##')
	// 	await release.build( identifier )
	// }
	// if ( args.indexOf('github') !== -1 ) {
	// 	console.log('## GITHUB ##')
	// 	await release.github(dry)
	// }
	// if ( args.indexOf('git') !== -1 ) {
	// 	console.log('## GIT ##')
	// 	await release.git(dry)
	// }
	// if ( args.indexOf('wporg') !== -1 ) {
	// 	console.log('## WPORG ##')
	// 	await release.wporg(dry)
	// }
})();
