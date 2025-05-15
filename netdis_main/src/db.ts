import Database from 'better-sqlite3';
class Db{
   private db;
   constructor(){
      this.db = new Database("bin/netdis.db")
      this.db.pragma('journal_mode = WAL');
   }
   setKey(key:string, value:string){
      const res = this.db.prepare('UPDATE netdis_info SET `value` = ? WHERE `key` = ?').run(value, key);
      return res;
   }
   getKey(key:string){
      const res = this.query('SELECT value FROM netdis_info WHERE `key` = ?', key);
      return res;
   }
   insert(req:string, ...keys){
      const res = this.db.prepare(req).run(...keys)
      return res
   }
   queryAll(req:string, ...keys){
      const res = this.db.prepare(req).all(...keys)
      return res
   }
   query(req:string, ...keys){
      const res = this.db.prepare(req).get(...keys)
      return res
   }
   purge(){
      const res = this.db.prepare(`delete from netdis_ping  WHERE date("timestamp"/1000, 'unixepoch') < date('now')`);
      const vac = this.db.prepare("vacuum");
      console.log(res, vac);
      
      return [res, vac]
   }
}
export default new Db()