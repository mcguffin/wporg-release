const colors = require('colors');
const fs = require('fs');
const glob = require('glob');
const exec = require('child_process');
const wp = require('../wp-header.js');
const { doing } = require('../doing.js');

const setup = package => {}

const run = ( dry = false ) => {

	return new Promise( ( resolve, reject ) => {

		const package = require( process.cwd() + '/package.json' ),
			assets_dir = !!package.wporg.wporg ? package.wporg.wporg.assets.replace(/^\/+|\/+$/g,'') : false,
			package_path = `../${package.name}.zip`;

		let do_assets = false;

		try {
			glob.sync( `./${assets_dir}/screenshot-*.png` ).forEach( file => {
				fs.accessSync( file, fs.constants.R_OK );
				do_assets = true;
			});
		} catch ( err ) {
			reject( err )
		}

		if ( do_assets ) {
			exec.execSync(`cp ${assets_dir}/screenshot-*.png .`);
			exec.execSync('git add . && git commit -m \"tmp\"');
		}
		exec.execSync(`git archive --format=zip --prefix=${package.name}/ --output=../${package.name}.zip --worktree-attributes HEAD`);

		if ( do_assets ) {
			exec.execSync( 'git reset --hard HEAD~' )
		}

		console.log(`Package created in: ${package_path}`);
		if ( package.wporg.type === 'theme' ) {
			console.log('Upload your Theme on https://wordpress.org/themes/upload/')
		} else if ( package.wporg.type === 'plugin' ) {
			console.log('Upload your Plugin on https://wordpress.org/plugins/developers/add/')
		}
		resolve();
	} );

}

module.exports = { setup, run };
