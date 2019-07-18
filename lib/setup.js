const fs = require('fs');
const prompts = require('prompts');
const colors = require('colors');
const https = require('https');
const exec = require('child_process');
const wp = require('./wp-header.js');
const release = require('./release/index.js');
const doing = require('./doing.js');

// Init package
const init = package => {
	if ( ! package.wporg ) {
		package.wporg = {}
	}
	package.wporg.steps = [];


	if ( ! package.wporg.type ) {
		console.log( 'Detecting package type' );
		package.wporg.type = wp.get_package_type();
		console.log(package.wporg.type);
	}
	if ( ! package.wporg.type ) {
		console.log('Couldn\'t identify Package Type');
		console.log('Plugin must have a PHP file in their root directory containing the plugin meta.');
		console.log('A Theme has its metadata either in ./style.css or ./src/scss/style.scss');
		throw('package type detection failed' );
	}
}

module.exports = async () => {
	const package = require( process.cwd() + '/package.json' );
	const steps = ['build','git','github','wporg','pack'];

	init( package );

	let i, step;

	for ( i in steps ) {
		step = steps[i];
		try {
			await release[step].setup(package);
		} catch( err ) {
			console.error( 'Error:'.red.underline, err.white )
			process.exit(1);
		}
	}

	fs.writeFileSync( './package.json', JSON.stringify( package, null, 2 ) );

	// .forEach(step => {
	// 	try {
	// 		await release[step].setup( package )
	// 	} catch(err){
	// 		console.log(err)
	// 	}
	// });
	//
	//
	// return new Promise( (resolve, reject) => {
	// 	try {
	// 		config( package ).then( config => {
	// 			package.wporg = config;
	// 			fs.writeFileSync( './package.json', JSON.stringify( package, null, 2 ) );
	// 			resolve();
	// 		} );
	// 	} catch (err) {
	// 		console.log(err);
	// 		reject();
	// 	}
	// });

}
