#!/usr/bin/env node
const release = require('./lib/release/index.js');
const [ , , ...args ] = process.argv;
const dry = args.indexOf('dry') !== -1;


const usage = `Usage \`wp-release [options]\`

Options can be:
 - setup: Run configuration wizard

Or one of:
 - Version identifiers: patch|minor|major
 - Mode: dry (Don't do anything on remotes)
 - wporg-Options: assets|source releae either only assets or only sourcecode (default: none)

Or any of
 - Release steps: build|git|github|wporg|pack (Default: wporg.steps in package.json)


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
	const package = require( process.cwd() + '/package.json' );
	let has_step_args = false;

	const do_step = async step => {
		console.log( `# Running: ${step}` );
		await release[step]( dry );
	}

	// show some help
	if ( !args.length || args.indexOf('?') !== -1 ) {
		console.log( usage )
		process.exit(0)
	}


	if ( args.indexOf('setup') !== -1 ) {
		await release.setup()
		process.exit(0)
	}
	if ( ! package.wporg ) {
		console.log( 'wporg release not configured! run `wp-release setup` first' )
		process.exit(1)
	}

	['build','github','git','wporg','pack'].forEach( step => {
		if ( args.indexOf( step ) !== -1 ) {
			has_step_args = true;
			do_step( step, args );
		}
	} );
	if ( ! has_step_args ) {
		package.wporg.steps.forEach( do_step );
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
