const keychain = require('./lib/keychain.js');


const [ , , ...args ] = process.argv;

if ( args.includes('keychain') ) {
	console.log('test keychain')
	let user = 'alice',
		url = 'svn://public.service/api',
		pw = '#a-very-secret-phrase!',
		get_pw;
	'Add:',keychain.add( user, url, pw, 'wporg-release keychain test' )
	get_pw = keychain.get( user, url )
	if ( pw !== get_pw ) {
		throw `'${pw}' !== '${get_pw}'`
	}
	console.log('Get: okay')
	console.log('Remove:',keychain.remove( user, url ))
	console.log('Get:',keychain.get( user, url ))
}
