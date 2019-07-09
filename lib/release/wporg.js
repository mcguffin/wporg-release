const fs = require('fs');
const exec = require('child_process');
const wp = require('../wp-header.js');

const svn = ( dry = false ) => {
	let svn_version;
	let commit_message;

	const package = require( process.cwd() + '/package.json' );
	const assets_arg = process.argv.indexOf( 'assets' ) !== -1;
	const sources_arg = process.argv.indexOf( 'source' ) !== -1;

	let do_assets = ! assets_arg && ! sources_arg ? true : assets_arg;
	let do_sources = ! assets_arg && ! sources_arg ? true : sources_arg;

	const svn_dir = 'tmp/svn';
	const git_dir = 'tmp/git';


	console.log('WPORG Setup')
	exec.execSync(`mkdir -p ${svn_dir}/`);
	exec.execSync(`mkdir -p ${git_dir}/`);
	console.log('...done')

	console.log('WPORG Gather Plugin')
	exec.execSync(`git archive HEAD | tar x --directory="${git_dir}/"`);
	console.log('...done')

	console.log('WPORG Fetch svn')
	exec.execSync(`svn checkout --depth immediates "${package.wporg.wporg.svn}" "${svn_dir}"`)
	if ( do_assets ) {
		console.log(exec.execSync('svn update --set-depth infinity assets',{
			cwd:svn_dir,
			encoding:'utf8',
		}))
	}
	if ( do_sources ) {
		console.log(exec.execSync('svn update --set-depth infinity trunk',{
			cwd:svn_dir,
			encoding:'utf8',
		}))
	} else {
		console.log(exec.execSync('svn update --set-depth infinity trunk/readme.txt',{
			cwd:svn_dir,
			encoding:'utf8',
		}))

	}

	console.log('...done')
	try {
		svn_version = wp.read_header_tag(`${svn_dir}/trunk/readme.txt`,'Stable tag')
	} catch ( err ) {
		svn_version = false;
	}

	console.log('WPORG Update svn')
	if ( do_assets ) {
		exec.execSync(`rsync -rc ".wporg/" ${svn_dir}/assets/ --delete`)
	}
	if ( do_sources ) {
		exec.execSync(`rsync -rc "${git_dir}/" ${svn_dir}/trunk/ --delete`)
	}

	exec.execSync('svn add . --force',{
		cwd:'./'+svn_dir,
	})
	exec.execSync('svn status | grep \'^!\' | sed \'s/! *//\' | xargs -I% svn rm %',{
		cwd:'./'+svn_dir,
	})
	console.log('...done')

	//
	if ( svn_version !== package.version ) {
		if ( do_sources ) {
			console.log( `WPORG Create svn Tag: tags/${package.version}` )
			exec.execSync(`svn cp "trunk" "tags/${package.version}"`,{
				cwd:svn_dir,
			})
		}
		commit_message = `Release ${package.version}`;
		console.log('...done');
	} else {
		if ( do_sources ) {
			commit_message = `Update trunk`;
		} else {
			commit_message = `Update assets`;
		}
	}

	console.log('WPORG svn Status:')
	console.log(exec.execSync('svn status',{
		encoding:'utf8',
		cwd:svn_dir,
	}));


	if ( ! dry ) {
		console.log('WPORG Committing...')
		console.log(exec.execSync(`svn commit -m "${commit_message}" --non-interactive`,{
			encoding:'utf8',
			cwd:svn_dir,
		}))
		console.log('...done')

		console.log('WPORG Cleaning up')
		exec.execSync('rm -rf tmp');
		console.log('...done')
	}



	console.log('All done!');
}

const pack = () => {

}

module.exports = ( dry = false ) => {

	return new Promise( ( resolve, reject ) => {
		//
		exec.execSync('rm -rf tmp');

		const package = require( process.cwd() + '/package.json' );

		if ( package.wporg.wporg.svn ) {
			svn( dry )
		}

		resolve();
	})
};
