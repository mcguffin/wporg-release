const colors = require('colors');
const fs = require('fs');
const glob = require('glob');
const exec = require('child_process');
const wp = require('../wp-header.js');
const { doing } = require('../doing.js');

const setup = package => {}

const run = ( dry = false, silent = false ) => {

	return new Promise( ( resolve, reject ) => {
		let do_assets
		const package = require( process.cwd() + '/package.json' ),
			package_path = `../${package.name}.zip`;

		exec.execSync(`git archive --format=zip --prefix=${package.name}/ --output=../${package.name}.zip HEAD`);

		!silent && console.log(`Package created in: ${package_path}`);
		resolve(package_path);
	} );

}

module.exports = { setup, run };
