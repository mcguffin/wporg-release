
const glob = require('glob');
const fs = require('fs');
const path = require('path');

const _get_header_tag_regex = (tag) => {
	return new RegExp('([\s\*]*)('+tag+'):(\\s*)(.*)','m');
}
let self;

self = module.exports = {
	get_header_files: ( patterns = null ) => {
		if ( patterns == null ) {
			patterns = ['*.php','src/scss/style.scss','style.css'];
		}
		let files = [];
		let has_scss_preprocessor = false
		patterns.forEach(pattern => {
			glob.sync(pattern,{}).forEach( file => {
				if ( self.read_header_tag( file, 'Version' ) !== null ) {
					files.push(file)
				}
			});
		});
		// rm css if scss found
		return files.map( f => {
			has_scss_preprocessor = has_scss_preprocessor || ['less','scss'].includes(f.split('.').pop())
			return f
		}).filter( f => {
			if ( f === 'style.css' && has_scss_preprocessor ) {
				return false;
			}
			return true;
		})
	},
	read_header_tag:( file, tag ) => {
		const contents = fs.readFileSync(file,'utf8');
		const regex = _get_header_tag_regex(tag);
		let matches = contents.match(regex);
		if ( null === matches || matches.length < 4 ) {
			return null;
		}
		return matches[4];
	},
	write_header_tag:(file,tag,value) => {
		let contents = fs.readFileSync( file, 'utf8' );
		const regex = _get_header_tag_regex( tag );
		contents = contents.replace( regex,'$1$2:$3' + value );
		//*
		fs.writeFileSync( file, contents );
		/*/
		console.log(contents)
		//*/
	},
	get_package_type: () => {
		if ( !! self.find_plugin_file() ) {
			return 'plugin';
		}
		if ( !! self.find_theme_file() ) {
			return 'theme';
		}
	},
	get_package_name: () => {
		let file = self.find_plugin_file();
		let tag = 'Plugin Name';
		if ( 'undefined' === typeof file ) {
			file = self.find_theme_file();
			tag = 'Theme Name';
		}
		return self.read_header_tag( file, tag );

	},
	find_package_file: () => {
		let file = self.find_plugin_file();
		if ( 'undefined' === typeof file ) {
			file = self.find_theme_file();
		}
		return file;
	},
	find_plugin_file: () => {
		return glob.sync('./*.php',{}).find((file) => {
			return self.read_header_tag( file, 'Plugin Name' ) !== null;
		});
	},
	find_theme_file: () => {
		return [ './src/scss/style.scss', './style.css' ].find( file => {
			if ( fs.existsSync(file) ) {
				return self.read_header_tag( file, 'Theme Name' ) !== null;
			}
		});
	}
}
