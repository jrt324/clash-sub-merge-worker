/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// TypeScript interfaces
interface ServerNode {
	serverConfig: string;
	proxyGroupNames: string[];
	base64Flag?: boolean;
}

interface GroupItem {
	name: string;
	proxies: string[];
}

// Import necessary libraries
import YAML  from 'yaml';
import { Base64 } from 'js-base64';

async function convertUrl(subscribeUrl: string, serverNodes: ServerNode[]) {
	console.log("subscribeUrl: " + subscribeUrl);

	const response = await fetch(subscribeUrl);
	const yamlStr = await response.text();
	const dictionary = YAML.parse(yamlStr);

	for (const server of serverNodes) {
		const groups = server.proxyGroupNames;
		console.log("get remote subscribe url success!");
		console.log("process append server node:" + server.serverConfig);

		let addServerStr = server.serverConfig;
		if (server.base64Flag) {
			addServerStr = Base64.decode(server.serverConfig);
		}

		const proxies = dictionary["proxies"] as any[];
		const addServerYaml = YAML.parse(addServerStr);
		proxies.push(addServerYaml);

		const proxyGroups = dictionary["proxy-groups"] as any[];
		const targetGroups = proxyGroups.filter(g => {
			const group = g;
			return groups.includes(group["name"]);
		});

		if (targetGroups.length > 0) {
			for (const targetGroup of targetGroups) {
				const targetGroupDict = targetGroup;
				const groupProxies = targetGroupDict["proxies"];
				groupProxies.push(addServerYaml["name"]);
			}
		}
	}

	const output = YAML.stringify(dictionary);
	console.log("convert success!");
	return output;
}

// Cloudflare Worker event listener
addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
	const url = new URL(request.url);
	const subUrl = url.searchParams.get('subUrl');
	const proxies = url.searchParams.get('proxies');
	const groups = url.searchParams.get('groups');

	if (!subUrl || !proxies || !groups) {
		return new Response("Missing parameters", { status: 400 });
	}

	console.log("call convert");

	const proxiesStr = Base64.decode(proxies);
	const groupsStr = Base64.decode(groups);

	const addProxies = JSON.parse(proxiesStr) as any[];
	const toGroups = JSON.parse(groupsStr) as GroupItem[];

	if (!addProxies || addProxies.length === 0) {
		return new Response("proxies is empty", { status: 400 });
	}
	if (!toGroups || toGroups.length === 0) {
		return new Response("groups is empty", { status: 400 });
	}

	const serverNodes = addProxies.map(proxy => {
		const proxyName = proxy["name"];
		const proxyGroups = toGroups.filter(g => g.proxies.includes(proxyName)).map(g => g.name);
		return {
			serverConfig: JSON.stringify(proxy),
			base64Flag: false,
			proxyGroupNames: proxyGroups
		};
	});

	const yaml = await convertUrl(subUrl, serverNodes);
	return new Response(yaml, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}
