const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const exec = require('child_process');
const { doing } = require('../doing.js');
const { erase, cursor } = require('sisteransi');

const force      = ['--force'].find( el => process.argv.indexOf(el) !== -1 );

const setup = async package => {

	console.log( 'Configuring test'.white.bold );

	if ( ! force && 'undefined' !== typeof package.wporg.test ) {
		console.log( 'test already configured. Use `--force` to override.'.red );
		return 'test'
	}

	// assume we're in wp-content/plugins
	const defaultcwd = path.resolve( process.cwd(), '../../..' )

	let { testcwd } = await prompts([
		{
			type: 'text',
			name: 'testcwd',
			message: `WordPress webroot (absolute or relative to cwd) [${defaultcwd}]:`,
			initial: '../../..'
		}
	], { onCancel: process.exit });

	if ( testcwd.length && '.' === testcwd.charAt(0) ) {
		testcwd = path.resolve( process.cwd(), testcwd )
	}

	fs.writeFileSync( '.wp-release-env.json', JSON.stringify( { cwd: testcwd }, null, 2 ) );

	package.wporg.test = [
		`wp plugin deactivate ${package.name} --context=admin`,
		`wp plugin activate ${package.name} --context=admin`,
	];

	return 'test'
}


const run = ( dry = false ) => {
	return new Promise( ( resolve, reject ) => {
		const package      = require( process.cwd() + '/package.json' );
		// const current_task = doing( `Running tests` );
		const cmd_args     = Object.assign({
			encoding: 'utf8',
			cwd: '.',
			stdio: [0,2,2]
		}, require( process.cwd() + '/.wp-release-env.json' ) )



		package.wporg.test.map( cmd => {
			console.log(`Running ${cmd.cyan.bold}`)
			process.stdout.write( "\n" );
			try {
				exec.execSync( cmd, cmd_args )
				process.stdout.write( `\nSuccess ${cmd}\n`.green.bold );
			} catch (error) {
				process.stdout.write( "\nTest failed.\n".red.bold + cursor.show );
				process.exit(1)
			}
		})
	})
}
module.exports = { setup, run }
