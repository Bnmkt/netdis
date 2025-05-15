import Tracker from "./Tracker.ts";
import ping from './ping.ts';

export default class DisTracker extends Tracker{
   private host;
   constructor(host="google.com"){
      super()
      this.host = host;
      
   }
   setHost(host){
      this.host = host;
   }
   async action(){
      try {
         if(this.host == "localhost/faker") return
         const hosts = this.host.split(",")
         const n = Math.floor(Math.random()*(hosts.length));
         const host = hosts[n].split(" ").filter(v=>v.length>0)[0]
         const res = await ping(host);         
         this.db.insert("INSERT INTO netdis_ping(`host`,`value`,`timestamp`) VALUES(?, ?, ?)", host, res.time, Date.now());
      } catch (error) {
         console.log(error);
         
      }
   }
}
// (()=>{
// const hosts = "abcfedgh".split("")
// let usage = {}
// function getRandomEntry(arr){
//    const n = Math.floor(Math.random()*(arr.length));
//    if(!usage[n]) usage[n] = 0
//    usage[n] = usage[n]+1
//    return arr[n]
// }
// for (let i = 0; i < 1000000; i++) {
//    getRandomEntry(hosts)
// }
// console.log(usage)
// })()
