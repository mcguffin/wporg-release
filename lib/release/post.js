/*
Do whatever is needed after releasing
*/

// versioning
const colors = require('colors');
const fs = require('fs');
const glob = require('glob');
const exec = require('child_process');
const { doing } = require('../doing.js');

const setup = package => {}

const run = ( dry = false, silent = false ) => new Promise( (resolve,reject) => {

	let current_task,
		package = require( process.cwd() + '/package.json' ),
		current_cmd;
	/**
	 *	Run prebuild script
	 */
	current_task = doing( `Running post scripts` );
	package.wporg.post = Object.assign( [], package.wporg.post )

	try {
		package.wporg.post.forEach( command => {
			current_cmd = command
			current_task.say( `running \`${command}\``.replace(/\n\r/g,'') )
			exec.execSync( command );
		});
	} catch ( error ) {
		current_task.say(`failed at \`${current_cmd}\``);
		current_task.fail();
		reject()
	}
	current_task.ok();
	resolve()

})

module.exports = { setup, run };
