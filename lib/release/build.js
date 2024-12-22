/*
Set version numbers in all relevant files, commits and pushes
*/

// versioning
const colors = require('colors');
const semver = require('semver');
const wp = require('../wp-header.js');
const fs = require('fs');
const glob = require('glob');
const exec = require('child_process');
const { doing } = require('../doing.js');

const identifier = ['major','minor','patch'].find( el => process.argv.indexOf(el) !== -1 );
const force      = ['--force'].find( el => process.argv.indexOf(el) !== -1 );

const setup = async package => {

	console.log( 'Configuring build process'.white.bold );

	if ( ! force && 'undefined' !== typeof package.wporg.build ) {
		console.log( 'Build already configured. use `--force` to override.'.red );
		return 'build'
	}

	const config = { prebuild: [], build: [] };
	let current_task, textdomain, domainpath;

	// find gulp build task
	current_task = doing( `detecting gulp tasks`, 'OK', 'no tasks' );
	try {
		const tasks = JSON.parse( exec.execSync('gulp --tasks-json',{stdio:['pipe','pipe','ignore']}) );
		tasks.nodes.forEach( task => {
			if ( ['dist','build'].indexOf( task.label ) !== -1 ) {
				current_task.say( `add 'gulp ${task.label}'` )
				config.build.push( `gulp ${task.label}` );
			}
		});
		current_task.ok()
	} catch(err) {
		current_task.fail()
	}

	current_task = doing( `detecting i18n`, 'OK', 'no i18n' );
	try {
		// i18n
		textdomain = wp.read_header_tag( wp.find_package_file(), 'Text Domain' ) || package.name;
		domainpath = wp.read_header_tag( wp.find_package_file(), 'Domain Path' ) || 'languages';

		domainpath = domainpath.replace(/^\/+|\/+$/g,'');
		if ( !! textdomain ) {
			current_task.ok()
			config.prebuild.push( `wp i18n make-pot . ${domainpath}/${textdomain}.pot --domain=${textdomain} --exclude=tmp` )
		}
	} catch(err) {
		current_task.fail()
		throw(err)
	}
	package.wporg.build = config;

}

const run = ( dry = false ) => new Promise( (resolve,reject) => {

	// buuilding
	const git = require('simple-git')('.');
	const package_name = wp.get_package_name();
	const branch = exec.execSync('git branch --show-current',{encoding:'utf8'}).replace(/\n/,'')
	let package = require( process.cwd() + '/package.json' );

	let version, build_msg, current_task, package_lock;


	if ( identifier !== undefined ) {
		if ( ['major','minor','patch'].indexOf(identifier) === -1 ) {
			reject( "Invalid version identifier. Must be one of  ['major','minor','patch']");
		}
		version = semver.inc( package.version, identifier );
		build_msg = `Building ${identifier} version`;
		commit_msg = `Release ${version}`;
	} else {
		version = package.version;
		build_msg = `Building version ${version}`;
		commit_msg = `Build ${version}`;
	}

	/**
	 *	Run prebuild script
	 */
	current_task = doing( `Running prebuild scripts` );
	package.wporg.build = Object.assign( { versionedFiles: null }, package.wporg.build )


	package.wporg.build.prebuild.forEach( command => {
		current_task.say( `running \`${command}\`` )
		exec.execSync( command );
	});
	current_task.ok();

	current_task = doing( build_msg, `${version}` );

	/**
	 *	Increment Version number in affected files
	 */
	// update package.json
	package_lock = require( process.cwd() + '/package-lock.json' );
	package_lock.version = package.version = version;

	fs.writeFileSync( 'package.json', JSON.stringify( package, null, 2 ) ); // relative to process.cwd()
	fs.writeFileSync( 'package-lock.json', JSON.stringify( package_lock, null, 2 ) ); // relative to process.cwd()

	// update wp plugin/theme files
	wp.get_header_files(package.wporg.build.versionedFiles).forEach(file => {
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
	current_task.ok()

	/**
	 *	Run build script
	 */
	current_task = doing( `Running build scripts` );
	package.wporg.build.build.forEach( command => {
		current_task.say( `running \`${command}\`` )
		exec.execSync(command)
	});
	current_task.ok()

	if ( 'github.com' === package.wporg.git.host ) { // sorry ... no bitbucket yet
		current_task = doing( `Write release info`, 'Done' );
		const id = `https://${package.wporg.git.host}/${package.wporg.git.user}/${package.name}/raw/${branch}/.wp-release-info.json`
		wp.write_header_tag( wp.find_package_file(), 'Update URI', id )
		fs.writeFileSync( '.wp-release-info.json', JSON.stringify( {
			id: id,
			slug: package.name,
			version: package.version,
			url: wp.read_header_tag( wp.find_package_file(), 'Plugin URI' ),
			package: `https://${package.wporg.git.host}/${package.wporg.git.user}/${package.name}/releases/download/${package.version}/${package.name}.zip`,
			tested: wp.read_header_tag('readme.txt', 'Tested up to' ),
			requires_php: wp.read_header_tag('readme.txt', 'Requires PHP' ),
		}, null, 2 ) );
		current_task.ok()
	}


	// git commit
	current_task = doing( `git`, 'Done' );
	current_task.say( 'add'.cyan )
	git
		.add( '.', (err,result) => {
			if ( err ) {
				reject(err)
			} else {
				current_task.say( 'commit'.cyan )
			}
		})
		.commit(commit_msg, ( err, result ) => {
			if ( err ) {
				reject(err)
			} else {
				current_task.ok();
				resolve()
			}
		} );

} )



module.exports = { setup, run }
