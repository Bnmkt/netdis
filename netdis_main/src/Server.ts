import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import ejs from "ejs";
import db from "./db.ts";
import DisTracker from "./DisTracker.ts";
import Tracker from "./Tracker.ts";
import { WebSocketServer } from "ws";
import Tray from "trayicon";
import { readdirSync, readFileSync, writeFile, writeFileSync } from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url"
import open from "open"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);

type dbEntry ={
	host:string,
	value:number,
	timestamp:number
}

function formatDateTime(date){ 
	date = date ?? Date.now()
	const d = new Date(parseInt(date)); 
	const yyyy = d.getFullYear(); 
	const mm = (d.getMonth()+1).toString().padStart(2, "0"); 
	const dd = d.getDate().toString().padStart(2, "0"); 
	const min = d.getMinutes().toString().padStart(2, "0"); 
	const h = d.getHours().toString().padStart(2, "0");
	return `${yyyy}-${mm}-${dd}T${h}:${min}` 
}
function getTimestamp(date){
	return new Date(date).getTime().toString();
}
function convertSecondstoTime(given_seconds) {

	const hours = Math.floor(given_seconds / 3600);
	const minutes = Math.floor((given_seconds - (hours * 3600)) / 60);
	const seconds = given_seconds - (hours * 3600) - (minutes * 60);

	let timeString = ``
	let d_seconds = ``
	let d_minutes = ``
	let d_hours = ``
	if(seconds!=0) d_seconds = `${Math.round(seconds).toString().padStart(2, "0")} secondes`
	if(given_seconds>60) d_minutes=`${minutes.toString().padStart(2, "0")} minutes`
	if(given_seconds>3600) d_hours=`${hours.toString().padStart(2, "0")} heures`
	timeString=`${d_hours}${d_minutes&&d_hours?" et ":""}${d_minutes}${d_minutes&&d_seconds?" et ":""}${d_seconds}`
	return timeString;
}
const functions={
	formatDateTime, getTimestamp, convertSecondstoTime
}
export default class Server {
	private trackers:Tracker[] = [];
	private port: number;
	private app;
	private ws:WebSocketServer;
	constructor(port: number = 8422) {
		console.time("[NetDis] stating time ");
		console.log(`[NetDis] Building server...`);
		this.port = port;
		this.init();
	}
	init() {
		console.log(`[NetDis] Initialisation...`);

		this.app = express();
		this.app.set("view engine", "ejs");
		this.app.set("views", "./src/views");
		this.app.use(express.static("./src/views"));
		this.app.use(bodyParser.json());
		this.app.use(express.json());
		this.app.set("trust proxy", true);
		this.app.use(
			bodyParser.urlencoded({
				extended: true,
			})
		);
		this.app.use(cors());
		this.app.use(
			session({
				secret: `${Date.now() * Math.random() * 1000}`,
				resave: false,
				saveUninitialized: true,
			})
		);
		const host = db.getKey("host").value;
		const frequency = db.getKey("frequency").value;
		const disTracker = new DisTracker(host);
		disTracker.setTime(frequency);
		disTracker.update()
		this.trackers.push(disTracker);
		this.setRoutes();
		this.run();
	}
	setRoutes() {
		this.app.all("*", (_req, _res, _next)=>{
			const uptime = process.uptime();
			const params = db.queryAll("SELECT * from netdis_info");
			const keys = {};
			params.forEach(param => {
				keys[param.key] = param.value
			});
			_res.locals.keys = keys;
			_res.locals.keys.uptime = uptime;
			_req.session.reload(()=>{
				const user = _req.session.user ?? {};
				_res.locals.user = user;
				
				
				if(!_res.locals.user.log){
					const url = `${_req.url}`
					if(url.startsWith("/login") || url.startsWith("/readme")) return _next();
					return _res.redirect("/login?path="+_req.url)
				}
				_next();
				
				console.log(`[${user.log??"invitedUser"}][${_req.method}] on ${_req.route?.path} `);
			})
		})
		this.app.get("/", (_req, _res, _next) => {
			const keys = _res.locals.keys
			const host = db.getKey("host").value;
			const freq = db.getKey("frequency").value;
			const maxbar = db.getKey("maxbar").value
			const test = db.queryAll(`
				WITH sequences AS (
					SELECT
						host,
						"value",
						"timestamp",
						"value" > 100 AS au_dessus_seuil,
						LAG("value" > 100, 1, 0) OVER (ORDER BY "timestamp") AS precedent_au_dessus_seuil
					FROM netdis_ping
					WHERE (date("timestamp"/1000, 'unixepoch') >= date('now', '-7 days') AND date("timestamp"/1000, 'unixepoch') <= date('now'))
					),
					groupes AS (
					SELECT
						host,
						"value",
						"timestamp",
						au_dessus_seuil,
						precedent_au_dessus_seuil,
						SUM(CASE WHEN au_dessus_seuil != precedent_au_dessus_seuil THEN 1 ELSE 0 END) OVER (ORDER BY "timestamp") AS groupe
					FROM sequences
					)
					SELECT
					host,
					MIN("timestamp") AS debut_sequence,
					MAX("timestamp") AS fin_sequence,
					COUNT(*) AS nombre_valeurs,
					AVG("value") AS moyenne_valeur
					FROM groupes
					WHERE au_dessus_seuil = 1
					GROUP BY host, groupe;`)
				const daily = db.query(`
					SELECT
						SUM(CASE WHEN "value" < 100 THEN 1 ELSE 0 END) AS nb_nor,
						SUM(CASE WHEN "value" = 'unknown' THEN 1 ELSE 0 END) AS nb_cut,
						SUM(CASE WHEN "value" > 100 THEN 1 ELSE 0 END) AS nb_dis,
						COUNT(*) AS nb_tot
					FROM netdis_ping
						WHERE date("timestamp"/1000, 'unixepoch') = date('now');`)
				const hosts = db.queryAll(`
					SELECT 
						host,
						COUNT(*) AS nb
						FROM netdis_ping 
					WHERE date("timestamp"/1000, 'unixepoch') >= date('now', '-7 days') AND date("timestamp"/1000, 'unixepoch') <= date('now')
					GROUP BY host
					`)
				const stats = db.query(`
					WITH max_tot_data AS (
						SELECT "host", "value" AS max_tot, "timestamp"
						FROM netdis_ping
						WHERE "value" != 'unknown'
						ORDER BY "value" DESC
						LIMIT 1
					),
					max_jour_data AS (
						SELECT "host", "value" AS max_jour, "timestamp"
						FROM netdis_ping
						WHERE "value" != 'unknown'
						AND date("timestamp"/1000, 'unixepoch') = date('now')
						ORDER BY "value" DESC
						LIMIT 1
					),
					sequences AS (
						SELECT
							"host",
							"timestamp",
							"value",
							"value" = 'unknown' AS is_unknown,
							LAG("value" = 'unknown', 1, 0) OVER (ORDER BY "timestamp") AS prev_is_unknown
						FROM netdis_ping
					),
					groupes AS (
						SELECT
							"host",
							"timestamp",
							is_unknown,
							prev_is_unknown,
							SUM(CASE WHEN is_unknown != prev_is_unknown THEN 1 ELSE 0 END) OVER (ORDER BY "timestamp") AS groupe
						FROM sequences
					)
					SELECT
						(SELECT COUNT(*) FROM netdis_ping) AS nb_tot,
						(SELECT COUNT(*) FROM netdis_ping WHERE date("timestamp"/1000, 'unixepoch') = date('now')) AS nb_jour,
						max_tot_data."host" AS max_tot_host,
						max_tot_data.max_tot,
						max_tot_data."timestamp" AS max_tot_timestamp,
						max_jour_data."host" AS max_jour_host,
						max_jour_data.max_jour,
						max_jour_data."timestamp" AS max_jour_timestamp,
						biggest_cut_data."host" AS biggest_cut_host,
						biggest_cut_data.biggest_cut
					FROM max_tot_data, max_jour_data,
						(SELECT host, COUNT(*) AS biggest_cut
						FROM groupes
						WHERE is_unknown = 1
						GROUP BY host, groupe
						ORDER BY biggest_cut DESC
						LIMIT 1) AS biggest_cut_data;
					`)
					
					
			_res.render("template", { view:"dashboard", title:"Tableau de bord" , datas:{host, freq, maxbar, keys, test, daily, hosts, stats}, functions});
		});
		this.app.get("/settings", (_req, _res, _next)=>{
			const keys = _res.locals.keys
			const backups = readdirSync(resolve(__dirname+"/../backup"));
			
			_res.render("template", { view:"settings" , title:"Paramètres", datas:{keys, backups}, functions});
		})
		this.app.post("/settings/:type", (_req, _res, _next)=>{
			const type = _req.params.type;
			console.log(`[${_req.session.user?.log}][${_req.method}][${type}] set setting [${JSON.stringify(_req.body)}] `);
			
			switch (type) {
				case 'site':
					(()=>{
						const {cmain,cmaindark,cmainlight,csecuno,csecduo,csectrio} = _req.body;
						db.setKey("cmain", cmain)
						db.setKey("cmaindark", cmaindark)
						db.setKey("cmainlight", cmainlight)
						db.setKey("csecuno", csecuno)
						db.setKey("csecduo", csecduo)
						db.setKey("csectrio", csectrio)
					})()
					break;
				case "admin":
						(()=>{
							const {name, pass, pass1, pass2} = _req.body
							const adminPass = db.getKey("adminPass").value;
							if(name==""||!name) return _res.redirect("/settings?error=name");
							if(pass==""||!pass) return _res.redirect("/settings?error=currpass");
							if(adminPass!=pass) return _res.redirect("/settings?error=currpass");
							if(pass1!=pass2) return _res.redirect("/settings?error=newpass");
							db.setKey("adminPass", pass1);
							db.setKey("adminName", name);
						})()
					break;
				case "history":
					(()=>{
						const {key_bph, key_h_start_date, key_h_end_date, htype, homit1,histype} = _req.body
						
						db.setKey("homit1", homit1);
						db.setKey("histype", histype);
						db.setKey("hdisplaytype", htype);
						db.setKey("barperhour", key_bph);
						db.setKey("hstartdate", getTimestamp(key_h_start_date));
						db.setKey("henddate", getTimestamp(key_h_end_date));
						_res.redirect("/history");
						return _next();
					})()
					break;
				case "dashboard":
					(()=>{
							const {key_host, key_frequency, maxbar} = _req.body
							
							db.setKey("host", key_host);
							db.setKey("frequency", key_frequency);
							db.setKey("maxbar", maxbar);
							const distrack = this.trackers[0]
							distrack.setTime(key_frequency);
							distrack.setHost(key_host);
							distrack.update();
					})()
					break;
				
				case "purgeDb":
					(()=>{
						db.purge();
					})()
					break;
				case "backupDb":
					(()=>{
						const filename = resolve(`${__dirname}/../backup`)+`/db_${Date.now().toString(36)}.json`;
						console.log("asking backup", filename);
						const obj = optimizeBakup(db.queryAll(`SELECT * from netdis_ping WHERE date("timestamp"/1000, 'unixepoch') < date('now')`))
						writeFileSync(filename,obj)
					})()
					break;
				default:
					break;
			}
			return _res.redirect("/settings")
		})
		this.app.get("/history", (_req, _res, _next)=>{
			const keys = _res.locals.keys
			const bph = db.getKey("barperhour").value
			const from = db.getKey("hstartdate").value;
			const to = db.getKey("henddate").value
			const history = db.queryAll("SELECT * FROM netdis_ping WHERE `timestamp` > ? AND `timestamp` < ?", from, to);
			_res.render("template", {view:"history", title:"Historique", datas:{history, bph, from, to, keys},functions})
		})
		this.app.get("/getLastRecord/:fromTime?",(_req, _res, _next)=>{
			_res.setHeader('Content-Type', 'text/event-stream');
			_res.setHeader('Cache-Control', 'no-cache');
			_res.setHeader('Connection', 'keep-alive');
			_res.flushHeaders();

			const freqency = db.getKey("frequency").value;
			const interval = setInterval(()=>{
				if(_res.locals.keys.host=="localhost/faker"){
					const faker = Math.random()<.98?((Math.random()*6)+10)*(Math.random()>.9?10:1):"unknown";
					const ts = Date.now();
					const obj = {
						value:faker,
						timestamp:ts,
						host:_res.locals.keys.host
					}
					return _res.write(`data:${JSON.stringify(obj)}\n\n`)
				} 
				const fromTime = _req.params.fromTime??Date.now()-(1000*5);
				const maxEntries = db.getKey("maxbar").value;
				
				const records = db.query("SELECT * FROM netdis_ping WHERE timestamp > ? LIMIT ?", fromTime, maxEntries)
				_res.write(`data:${JSON.stringify(records)}\n\n`)
			},freqency);
			_req.on('close', ()=>{
				clearInterval(interval);
				_res.end();
			})
		})
		this.app.get("/login", (_req, _res, _next)=>{
			const keys = _res.locals.keys
			_res.render("template", {view:"login", title:"Connexion", datas:{keys}})
		})
		
		this.app.post("/login", (_req, _res, _next)=>{
			const adminName = db.getKey("adminName").value;
			const adminPass = db.getKey("adminPass").value;
			const {name, pass} = _req.body;
			if(adminName!=name){
				console.log(`[invitedUser] Failed: Wrong username`);
				return _res.redirect("/login?error=name");
			}
			if(adminPass!=pass){
				console.log(`[invitedUser] Failed: Wrong password`);
				return _res.redirect("/login?error=pass");
			}
			console.log(`[invitedUser] Successfully connected on ${adminName}`);
			_req.session.reload(()=>{
				const user = {log:name};
				_req.session.user = user;
				const path = _req.query.path??"/";
				_res.redirect(path)
			})
		})
		this.app.get("/about", (_req, _res, _next)=>{
			const keys = _res.locals.keys
			_res.render("template", {view:"about", title:"À propos", datas:{keys}})
		})
		
		this.app.get("/readme", (_req, _res, _next)=>{
			const readme = readFileSync(__dirname+"/../README.md")
			const keys = _res.locals.keys
			_res.render("template", {view:"readme", title:"Lisez moi", datas:{keys, readme}})
		})
	}
	run() {
		this.app.listen(this.port, () => {
			console.log(`[NetDis] Running on http://127.0.0.1:${this.port}`);
			console.timeEnd("[NetDis] stating time ");
			Tray.create(tray=>{
				const icon = readFileSync("./src/views/assets/ico.png");
				tray.setIcon(icon)
				
				const createItems = ()=>{
					let title = tray.item ("NetDis");
					let main = tray.item("Open GUI", ()=>{
						open(`http://127.0.0.1:${this.port}`)
					});
					const distracker = this.trackers[0];
					let tracker = tray.item(`${distracker.isActive()?"Disable":"Enable"} tracker`, ()=>{
						if(distracker.isActive()){
							distracker.disable()
						}else{
							distracker.enable()
						}
						setMenu();
					});
					let backup = tray.item("Backup folder", ()=>{
						const path = resolve(`${__dirname}/../backup`);
						console.log(path);
						
						open("file://"+path)
					})
					let quit = tray.item("Quit", () => {
						console.log(`[NetDis] Stopped by Tray`);
						
						tray.kill()
						const pid:any = readFileSync("pid", "utf8")
						process.kill(pid)
					});
					return [title,tray.separator(),main, tracker, backup, quit]
				}
				const setMenu = ()=>{
					tray.setMenu(...createItems())
				}
				setMenu()
				tray.setTitle("NetDis");
				tray.notify("Netdis", "Votre traceur tourne à plein régime !")
			})
		});
		this.ws = new WebSocketServer({server:this.app})
		this.ws.on("connection", (client)=>{
			console.log("hello");
			
			client.on("close", ()=>{ client.terminate(); })
		})
	}
}
function optimizeBakup(obj) {
   const grouped_hosts = groupBy(obj, "host", (v) => { return { value: v.value, timestamp: v.timestamp } })
   const narr = grouped_hosts.slice(grouped_hosts[0] + 1)
   const hosts = grouped_hosts.slice(0, grouped_hosts[0] + 1)
   const nobj:any[] = [...hosts,]
   narr.forEach(v => {
      nobj.push(groupBy(v, "value", (x, y) => x.timestamp - (y.timestamp || 0)))
   })
   return JSON.stringify(nobj)
}

function groupBy(obj, key, valueToPush) {
   const k = []
   let nobj:any[] = [];
   let last = 0;
   let objArr = Array.isArray(obj) ? obj : [obj];

   objArr.forEach((v) => {
      const i = k.findIndex(h => h == v[key]);
      let index = i;
      if (i == -1) {
         k.push(v[key]);
         index = k.length - 1;
         nobj[index] = [];
         last = 0
      }
      const values = valueToPush(v, last)
      if (objArr.length == 1) {
         nobj[index] = values
      } else {
         nobj[index].push(values)
      }

      last = v
   })

   nobj = nobj.map(v => (typeof v == "object" && v.length == 1) ? v[0] : v);

   nobj.unshift(k.length, ...k)
   return nobj
}
function parseBackup(obj) {
   try {
      if (typeof obj == "string") obj = JSON.parse(obj)
      const nHosts = obj[0];
      const hostArr = obj.slice(1, nHosts + 1);
      const valueArr = obj.slice(nHosts + 1)
      const entries:dbEntry[] = []
      for (let i = 0; i < nHosts; i++) {
         const host = hostArr[i]
         const valuesArr = valueArr[i];
         const valuesN = valuesArr[0]
         const values = valuesArr.slice(1, valuesN + 1)
         const timestampArr = valuesArr.slice(valuesN + 1)
         for (let y = 0; y < valuesN; y++) {
            let last = 0;
            timestampArr[y].forEach(time => {
               entries.push({ host, value: values[y], timestamp: time + last });
               last += time;
            });
         }
      }
      return entries.sort((a, b) => a.timestamp - b.timestamp);
   } catch (error) {
      throw new Error("Cannot parse BackupObject")
   }
}