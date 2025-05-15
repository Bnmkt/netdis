import db from "./db.ts";
export default abstract class Tracker{
   protected interval:NodeJS.Timeout;
   protected time:number = 1000;
   protected active:boolean = true;
   protected db = db;
   constructor(){
      this.update();
   }
   isActive(){
      return this.active;
   }
   enable(){
      this.active = true;
      console.log(`[${this.constructor.name}] is enabled`);
   }
   disable(){
      this.active = false;
      console.log(`[${this.constructor.name}] is disabled`);
   }
   setTime(time:number){
      this.time = time
   }
   update():void{
      clearInterval(this.interval);
      this.interval = setInterval(() => {
         if(!this.active) return;
         this.action();
      }, this.time);
      
      console.log(`[${this.constructor.name}] running at ${this.time}`);
   }
   abstract action():void;
}