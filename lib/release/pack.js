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
			assets_dir = !!package.wporg.wporg ? package.wporg.wporg.assets.replace(/^\/+|\/+$/g,'') : false,
			package_path = `../${package.name}.zip`;

		// let do_assets = false;
		//
		try {
			glob.sync( `./${assets_dir}/screenshot-*.png` ).forEach( file => {
				fs.accessSync( file, fs.constants.R_OK );
				do_assets = true;
			});
		} catch ( err ) {
			reject( err )
		}

		exec.execSync(`git archive --format=zip --prefix=${package.name}/ --output=../${package.name}.zip --worktree-attributes ${package.version}`);

		// add screenshots to zip
		if ( do_assets ) {
			exec.execSync(`ln -s ./${assets_dir} ./${package.name}`)
			exec.execSync( `zip -u ../${package.name}.zip ./${package.name}/screenshot-*.png` );
			exec.execSync(`rm ./${package.name}`)
		}

		!silent && console.log(`Package created in: ${package_path}`);
		if ( package.wporg.type === 'theme' ) {
			!silent && console.log('Upload your Theme on https://wordpress.org/themes/upload/')
		} else if ( package.wporg.type === 'plugin' ) {
			!silent && console.log('Upload your Plugin on https://wordpress.org/plugins/developers/add/')
		}
		resolve(package_path);
	} );

}

module.exports = { setup, run };
