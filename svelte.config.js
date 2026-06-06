import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// El puerto se controla con la variable de entorno `PORT` al ejecutar el build:
		//   PORT=3076 node build
		// (la opción `port` no existe en @sveltejs/adapter-node).
		adapter: adapter()
	}
};

export default config;
