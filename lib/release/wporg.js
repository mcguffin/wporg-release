const colors = require('colors');
const fs = require('fs');
const exec = require('child_process');
const wp = require('../wp-header.js');
const https = require('https');
const prompts = require('prompts');
const { doing } = require('../doing.js');
const keychain = require('../keychain.js');

const svn_base_url = 'svn://plugins.svn.wordpress.org';

const force      = ['--force'].find( el => process.argv.indexOf(el) !== -1 );

const is_wporg = package => new Promise( ( resolve, reject ) => {

	const type = wp.get_package_type();
	let api_url, current_task;
	let resp_data = '';
//package.name='acf-dropzone'
	if ( type === 'plugin' ) {
		api_url = `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${package.name}`;
	} else if ( type === 'theme' ) {
		api_url = `https://api.wordpress.org/themes/info/1.1/?action=theme_information&request[slug]=${package.name}`;
	}
	current_task = doing(`${type} ${package.name} listed at wporg?`,'Yes!','nope')

	const req = https.request( api_url, {
		method: 'GET',
		headers: {
			'User-Agent' : 'Nodejs'
		}
	}, resp => {
		resp.setEncoding('utf8');
		resp.on('data',data => {
			resp_data += data;
		});
		resp.on('end',() => {
			const resp = JSON.parse( resp_data );
			const result = !! resp.slug;
			if ( result ) {
				current_task.ok()
			} else {
				current_task.fail()
			}
			resolve( result );
		});
		resp.on('error',error => {
			current_task.fail()
			reject(error);
		});
	});
	req.end();

} );



const setup = async package => {
	console.log( 'Configuring wporg release process'.white.bold );

	if ( ! force && 'undefined' !== typeof package.wporg.wporg ) {
		console.log( 'wporg already configured. use `--force` to override.'.red );
		return package.wporg.steps.filter( step => ['pack','wporg'].includes(step))
	}

	let svn, current_task, svn_pw, pw_response, result;
	const active = await is_wporg( package );

	if ( package.wporg.type === 'plugin' ) {
		svn = `https://plugins.svn.wordpress.org/${package.name}/`;
		// mk assets dir
		const response = await prompts([
			{
				type: 'text',
				name: 'assets',
				message: `Assets directory [.wporg]:`,
				initial: '.wporg'
			},
			{
				type: 'text',
				name: 'svn_user',
				message: 'wp.org Username:',
				initial: '',
				validate: value => !!value
			}
		], { onCancel: process.exit });

		package.wporg.wporg = response;

		if ( ! keychain.get( response.svn_user, svn_base_url ) ) {
			pw_response = await prompts([
				{
					type: 'password',
					name: 'svn_pw',
					message: 'wp.org Password:',
				}
			], { onCancel: process.exit });
			keychain.add( response.svn_user, svn_base_url, pw_response.svn_pw, 'Added by wporg-release' )
		}


		if ( active ) {
			package.wporg.wporg.svn = svn;
			result = 'wporg'
		} else {
			result = 'pack'
		}

		current_task = doing( `create assets dir: ${response.assets}`, 'Done' )

		fs.mkdirSync( response.assets, { recursive: true } );
		current_task.ok();

		if ( active ) {
			console.log( `\`wp-release\` will commit to svn: ${svn}`.cyan );
		} else {
			console.log( `\`wp-release\` will create package zipfile for submission`.cyan );
		}

	} else if ( package.wporg.type === 'theme' && active ) {

		result = 'pack'

		console.log( `\`wp-release\` will create package zipfile for submission`.cyan );

	}
	return result
};



const svn = ( dry = false ) => {
	let svn_version,
		svn_pw,
		ci_cmd,
		ci_result,
		commit_message,
		current_task;

	const package = require( process.cwd() + '/package.json' );
	const assets_arg = process.argv.indexOf( 'assets' ) !== -1;
	const sources_arg = process.argv.indexOf( 'source' ) !== -1;

	let do_assets = ! assets_arg && ! sources_arg ? true : assets_arg;
	let do_sources = ! assets_arg && ! sources_arg ? true : sources_arg;

	const svn_dir = 'tmp/svn';
	const git_dir = 'tmp/git';

	if ( ! package.wporg.wporg.svn ) {
		current_task.fail('svn url not configured')
		return
	}

	current_task = doing('get files from git');
	current_task.say('create temp dirs')
	exec.execSync(`mkdir -p ${svn_dir}/`);
	exec.execSync(`mkdir -p ${git_dir}/`);

	current_task.say('create package')
	exec.execSync(`git archive HEAD | tar x --directory="${git_dir}/"`);
	current_task.ok()


	current_task = doing('checkout svn');
	// checkout flat empty svn
	exec.execSync(`svn checkout --depth immediates "${package.wporg.wporg.svn}" "${svn_dir}"`)
	if ( do_assets ) {
		current_task.say('checkout assets')
		exec.execSync('svn update --set-depth infinity assets',{
			cwd:svn_dir,
			encoding:'utf8',
		})
	}
	if ( do_sources ) {
		current_task.say('checkout trunk')
		exec.execSync('svn update --set-depth infinity trunk',{
			cwd:svn_dir,
			encoding:'utf8',
		})
	} else {
		current_task.say('checkout readme.txt')
		exec.execSync('svn update --set-depth infinity trunk/readme.txt',{
			cwd:svn_dir,
			encoding:'utf8',
		})
	}
	current_task.ok()


	try {
		svn_version = wp.read_header_tag(`${svn_dir}/trunk/readme.txt`,'Stable tag')
	} catch ( err ) {
		svn_version = false;
	}

	current_task = doing('Populate SVN');
	if ( do_assets ) {
		current_task.say('sync assets')
		exec.execSync(`rsync -rc ".wporg/" ${svn_dir}/assets/ --delete`)
	}
	if ( do_sources ) {
		current_task.say('sync source')
		exec.execSync(`rsync -rc "${git_dir}/" ${svn_dir}/trunk/ --delete`)
	}
	current_task.say('add changes')
	exec.execSync('svn add . --force',{
		cwd:'./'+svn_dir,
	})
	current_task.say('remove deleted')
	exec.execSync('svn status | grep \'^!\' | sed \'s/! *//\' | xargs -I% svn rm %',{
		cwd:'./'+svn_dir,
	})
	current_task.ok()

	//
	if ( svn_version !== package.version ) {
		// make new version tag
		current_task = doing('Crafting new tag','Done');
		if ( do_sources ) {
			current_task.say('create tag');
			exec.execSync(`svn cp "trunk" "tags/${package.version}"`,{
				cwd:svn_dir,
			})
		}
		commit_message = `Release ${package.version}`;
		current_task.ok();
	} else {
		current_task.say('update readme.txt')
		exec.execSync(`svn update "tags/${package.version}"`,{
			cwd:svn_dir,
			encoding:'utf8',
		})
		exec.execSync(`cp ${svn_dir}/trunk/readme.txt ${svn_dir}/tags/${package.version}/readme.txt`)

		current_task = doing('Updating trunk','Done').ok();
		if ( do_sources ) {
			commit_message = `Update trunk`;
		} else {
			commit_message = `Update assets`;
		}
	}

	console.log( 'svn status:' )
	console.log( exec.execSync( 'svn status', {
		encoding:'utf8',
		cwd:svn_dir,
	} ));

	if ( ! dry ) {
		current_task = doing('Commit', 'Done');

		if ( !! package.wporg.wporg.svn_user ) {
			svn_pw = keychain.get( package.wporg.wporg.svn_user, svn_base_url )
			ci_cmd = `svn commit -m "${commit_message}" --username ${package.wporg.wporg.svn_user} --password '${svn_pw}'`
		} else {
			ci_cmd = `svn commit -m "${commit_message}" --non-interactive`
		}

		try {
			ci_result = exec.execSync( ci_cmd, {
				encoding:'utf8',
				cwd:svn_dir
			});

			current_task.ok()
			console.log('commit:')
			console.log( ci_result )

			current_task = doing('Cleanup', 'Done');
			exec.execSync('rm -rf tmp');
			current_task.ok()
		} catch(err) {
			ci_cmd = ci_cmd.replace( /--password(.+)$/g, '******' ) // dont show password
			current_task.fail(`${ci_cmd} failed`)
		}
	}
}

const run = ( dry = false ) => {

	return new Promise( ( resolve, reject ) => {
		// cleanup
		exec.execSync('rm -rf tmp');

		try {
			svn( dry )
		} catch( err ) {
			reject()
			return
		}

		resolve();
	})
};


module.exports = { setup, run }
