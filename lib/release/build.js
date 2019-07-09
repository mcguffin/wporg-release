/*
Set version numbers in all relevant files, commits and pushes
*/

// versioning
const semver = require('semver');
const wp = require('../wp-header.js');
const fs = require('fs');
const glob = require('glob');

const identifier = ['major','minor','patch'].find( el => process.argv.indexOf(el) !== -1 );
console.log(identifier);


module.exports = ( dry = false ) => {
	return new Promise( (resolve,reject) => {
		// buuilding
		const localGulp = require('./gulpfile.js');

		const git = require('simple-git')('.');
		let branch;

		let package = require( process.cwd() + '/package.json' );

		if ( ['major','minor','patch'].indexOf(identifier) === -1 ) {
			reject( "Invalid version identifier. Must be one of  ['major','minor','patch']");
		}

		/**
		 *	Run prebuild script
		 */
	 	console.log(`Run prebuild scripts`);
		package.wporg.build.prebuild.forEach( command => {
			exec.execSync(command)
		});


		console.log(`building ${identifier} version update`);
		const package_name = wp.get_package_name();
		const version = semver.inc( package.version, identifier )

		/**
		 *	Increment Version number in affected files
		 */
		// update package.json
		package.version = version;
		fs.writeFileSync( 'package.json', JSON.stringify( package, null, 2 ) ); // relative to process.cwd()

		// update wp plugin/theme files
		wp.get_header_files().forEach(file => {
			wp.write_header_tag(file,'Version',version);
		});
		try {
			// update readme
			wp.write_header_tag('readme.txt','Stable tag',version);
		} catch( err ) {
			//
		}

		// update *.pot
		glob.sync('languages/*.pot').forEach( file => {
			let content = fs.readFileSync( file, { encoding: 'utf8' } );
			// "Project-Id-Version: Serial 0.0.4\n"

			content = content.replace(
				/(Project-Id-Version:\s)(.*)(\\n)/im,
				'$1'+ package_name + ' ' + version +'$3'
			);
			fs.writeFileSync(file,content)
		});


		/**
		 *	Run build script
		 */
		console.log(`Run build scripts`);
		package.wporg.build.build.forEach( command => {
			exec.execSync(command)
		});

		// git commit
		git.branch( (err,res) => {
			branch = res.current;
			// ... add and commit
			git
				.add('.')
				.commit(`Release ${version} from ${branch}`)
				.exec( resolve )
		});
	} )
}
