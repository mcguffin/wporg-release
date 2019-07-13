/*
Builds a github release from current version number
*/

const wp = require('../wp-header.js');
const fs = require('fs');
const glob = require('glob');
const git = require('simple-git')('.');
const exec = require('child_process');
const https = require('https');

module.exports = ( dry = false ) => {
	return new Promise( ( resolve, reject ) => {
		const package = require( process.cwd() + '/package.json' );
		
		let branch;
		let repo;
		let token;
		let gitInst;

		gitInst = git
			.listRemote(['--get-url'], (err,res) => {
				repo = res.match(/^git@github\.com:(.+)\.git/s)[1];
				console.log(`... got repo: ${repo}`)
			})
			.branch( (err,res) => {
				branch = res.current;
				console.log(`... got branch: ${branch}`)
			})
			.exec( () => {
				token = exec.execSync( `security find-generic-password -a ${package.wporg.github.user} -s "https://api.github.com" -w`, { encoding: 'utf8' } ).trim();
				console.log(`... got token`)
			} );

		if ( ! dry ) {
			console.log(`... pushing`)
			gitInst.push()
				.then( () => console.log(`... pushed!`) )
		}

		gitInst.exec( () => {
			console.log(`... calling api.github.com`)
			const data = {
				version:		package.version,
				branch:			branch,
				require_wp:		wp.read_header_tag('readme.txt', 'Requires at least' ),
				max_wp:			wp.read_header_tag('readme.txt', 'Tested up to' ),
				require_php:	wp.read_header_tag('readme.txt', 'Requires PHP' ),
			}

			const req_data = {
				tag_name:			package.version,
				target_commitish:	branch,
				name:				package.version,
				body:				`Release ${data.version} from ${data.branch}

Requires at least: ${data.require_wp}
Tested up to: ${data.max_wp}
Requires PHP: ${data.require_php}`,
				draft:				false,
				prerelease:			false
			}
			const api_url = `https://${package.wporg.github.user}:${token}@api.github.com/repos/${repo}/releases`;
			let resp_data = '';

			if ( dry ) {
				console.log(`... api request data:`)
				console.log('url: ' + api_url.replace(/:([a-z0-9]+)@/,'**************'));
				console.log(req_data);
				resolve();
			} else {



				const req = https.request( api_url, {
					// host: 'api.github.com',
					// port: 443,
					// path: `repos/${repo}/releases`,
					method: 'POST',
					headers: {
		//				'Authorization' : 'token ${token}',
						'User-Agent' : 'Nodejs'
					}
				}, resp => {
					resp.setEncoding('utf8');
					resp.on('data',data => {
						resp_data += data;
					});
					resp.on('end',() => {
						console.log(`... created release!`);
						resolve( JSON.parse( resp_data ) );
					});
					resp.on('error',error => {
						console.log(`... Error creating release`);
						reject(error);
					});
				});
				req.write( JSON.stringify( req_data, null ) )
				req.end();

			}
		})


	} );

}
