import { existsSync, lstatSync, readdirSync, renameSync, rm } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mpa from 'vite-plugin-multi-pages'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						return id.split('node_modules/')[1].split('/')[0].replace('@', '')
					}
				},
			},
		},
	},
	plugins: [
		react(),
		mpa({
			scanDir: 'src/pages',
			defaultEntries: 'search',
		}),
		{
			name: 'after-build',
			apply: 'build',
			enforce: 'post',
			closeBundle() {
				const pagesDir = 'dist/src/pages'
				if (!existsSync(pagesDir)) return
				for (const folder of readdirSync(pagesDir)) {
					const folderPath = path.join(pagesDir, folder)
					if (lstatSync(folderPath).isDirectory()) {
						const indexPath = path.join(folderPath, 'index.html')
						if (existsSync(indexPath)) {
							const pathToMove = `dist/${folder}.html`
							// biome-ignore lint/suspicious/noConsoleLog: Logging file moves during build process for debugging
							console.log(`${indexPath} -> ${pathToMove}`)
							renameSync(indexPath, pathToMove)
						} else {
							// biome-ignore lint/suspicious/noConsoleLog: Logging missing index.html files during build process for debugging
							console.log(`${folder} does not have an index.html file`)
						}
					}
				}
				rm('dist/src', { recursive: true }, (err) => {
					if (err) console.error(err)
				})
			},
		},
	],
	appType: 'mpa',
	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ['**/src-tauri/**'],
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
})
