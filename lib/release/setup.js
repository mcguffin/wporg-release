const fs = require('fs');
const exec = require('child_process');
const wp = require('../wp-release.js');

const get_credentails = ( service, defaults = { username: '', password: '' } ) => {

}

const git = () => {
	let giturl = exec.execSync('git remote get-url origin');
	let gituser = exec.execSync('git config user.name');
	let githost = giturl.match('(github\.com|bitbucket\.org)');

	console.log(githost)
	return {
		giturl,
		gituser
	}
}

module.exports = () => {

	return new Promise( ( resolve, reject ) => {
		let stable_tag = wp.read_header_tag( 'readme.txt', 'Stable tag' );
		console.log(stable_tag)
		console.log(git())
		/*
		1. plugin or theme or none?
		2. @plugin
			detect main plugin file
		3. @theme
			...?
		4. Ask: github user and access token?
			> exec
		*/
	});
}
