import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'

const { HOST = '', AUTH = '' } = process.env

Bun.serve({
	async fetch(req) {
		const { pathname } = new URL(req.url)
		const name = pathname.slice(1)
		const path = `tmp/${name}`

		console.log(`=== ${name} ===`)

		if (!name.endsWith('.json')) {
			return new Response('404!', { status: 404 })
		}

		const file = Bun.file(path)
		if (await file.exists()) {
			console.log('exists!')
			return new Response(await file.text(), {
				headers: {
					'content-type': 'application/json',
				},
			})
		}

		let answer = ''

		const requestUrl = `${HOST}${name}`

		try {
			const original = await fetchOriginal(`${requestUrl}`)
			answer = original
			console.log('success!')
		} catch {
			const rl = readline.createInterface({ input, output })
			answer = await rl.question(`${requestUrl}\n> `)
			rl.close()

			await Bun.write(path, answer)
		}

		return new Response(answer, {
			headers: {
				'content-type': 'application/json',
			},
		})
	},
})

async function fetchOriginal(url: string) {
	const response = await fetch(url, {
		headers: {
			authorization: AUTH,
		},
		redirect: 'follow',
	})

	if (response.ok) {
		return response.text()
	}

	throw new Error('failed request!')
}
