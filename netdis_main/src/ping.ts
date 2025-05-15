import ping from "ping";
// import Database from "better-sqlite3";
export default async function (host = "google.com") {
	return await ping.promise.probe(host,{});
}
