
const colors = require('colors');
const git = require('simple-git')('.');
//const git = require('simple-git/promise')('.');
const exec = require('child_process');
const prompts = require('prompts');
const { doing } = require('../doing.js');

const branch = exec.execSync('git branch --show-current',{encoding:'utf8'}).replace(/\n/,'')

const setup = async package => {

	console.log( 'Configuring git release process'.white.bold );

	const remote = exec.execSync( 'git remote get-url origin', { encoding: 'utf8' } ).trim();
	let current_task, user, host;

	current_task = doing( `Getting git configuration` );
	try {
		[ , host ] = remote.match( /git@([a-z0-9-\.]+\.([a-z]+))\:/ );
	} catch ( err ) {
		current_task.fail();
		throw( `Git remote is not ssh: ${remote}` )
	}

	try {
		// get user from config
		user = package.wporg.git.user;
	} catch( err ) {}

	if ( user === undefined ) {
		user = exec.execSync( 'git config user.name', { encoding: 'utf8' } ).trim();
	}
	current_task.ok();
	console.log( `User: ${user}, Host: ${host}` );

	const user_prompt = await prompts([
		{
			type: 'text',
			name: 'user',
			message: `${host} username [${user}]:`,
			initial: user
		}
	], { onCancel: process.exit } );

	package.wporg.steps.push( 'git' );
	package.wporg.git = { host, ...user_prompt }

}

const gitpipe = () => {

}

const run = ( dry = false ) => new Promise( ( resolve, reject ) => {

	const package = require( process.cwd() + '/package.json' );
	let current_task;

	if ( dry ) {
		console.log( `git tag ${package.version}` );
		console.log( 'git push origin --tags' );
		resolve();
	} else {
		// current_task = doing( `git`, 'Done' );
		// current_task.say( 'push origin master'.cyan );
		/*
		const gits = async () => {

			const fail_cb = err => {
				//current_task.fail();
				!!err && console.error(err.red)
				reject(err);
			}
			try {
					.push('origin','master',)
				console.log('pushed'.yellow)
			} catch (err) {
				fail_cb(err);
			}

			try {
					.addTag( package.version )
				console.log('tagged'.yellow)
			} catch (err) {
				fail_cb(err);
			}

			try {
					.push( 'origin', '--tags' )
				console.log('pushed tag'.yellow)
			} catch (err) {
				fail_cb(err);
			}
			resolve();
		}
		gits();
		/*/

		current_task = doing( `git`, 'Done' );
		current_task.say( `push origin ${branch}`.cyan );
		git
			.push('origin',branch, (err,result) => {
				if ( err !== null ) {
					current_task.fail()
					reject(err)
				} else {
					current_task.say( 'tag ${package.version}'.cyan );
				}
			})
			.addTag( package.version, (err,result) => {
				if ( err !== null ) {
					current_task.fail()
					reject(err)
				} else {
					current_task.say( `push origin ${package.version}`.cyan );
				}
			} )
			.push( 'origin', package.version, (err,result) => {
				if ( err !== null ) {
					current_task.fail()
					reject(err)
				} else {
					current_task.ok()
					resolve();
				}
			} )

	}
});

module.exports = { setup, run }
