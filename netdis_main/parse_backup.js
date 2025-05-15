const obj = [{
   "host": "google.com",
   "value": 14,
   "timestamp": 1739884628962
}, {
   "host": "google.be",
   "value": 17,
   "timestamp": 1739884629965
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630972
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630976
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630979
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630982
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630987
}, {
   "host": "google.com",
   "value": 15,
   "timestamp": 1739884630999
}]


function optimizeBakup(obj) {
   const grouped_hosts = groupBy(obj, "host", (v) => { return { value: v.value, timestamp: v.timestamp } })
   const narr = grouped_hosts.slice(grouped_hosts[0] + 1)
   const hosts = grouped_hosts.slice(0, grouped_hosts[0] + 1)
   const nobj = [...hosts,]
   narr.forEach(v => {
      nobj.push(groupBy(v, "value", (x, y) => x.timestamp - (y.timestamp || 0)))
   })
   return JSON.stringify(nobj)
}

function groupBy(obj, key, valueToPush) {
   const k = []
   let nobj = [];
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
   if (typeof obj == "string") obj = JSON.parse(obj)
   const nHosts = obj[0];
   const hostArr = obj.slice(1, nHosts + 1);
   const valueArr = obj.slice(nHosts + 1)
   const entries = []
   for (let i = 0; i < nHosts; i++) {
      const host = hostArr[i]
      const valuesArr = valueArr[i];
      const valuesN = valuesArr[0]
      const values = valuesArr.slice(1, valuesN + 1)
      const timestampArr = valuesArr.slice(valuesN + 1)
      for (let y = 0; y < valuesN; y++) {
         let last = 0;
         let timeArr = Array.isArray(timestampArr[y]) ? timestampArr[y] : [timestampArr[y]]
         timeArr.forEach(time => {
            entries.push({ host, value: values[y], timestamp: time + last });
            last += time;
         });
      }
   }
   return entries.sort((a, b) => a.timestamp - b.timestamp);
}


console.log(`Objet de base :`, obj);
const optimized = optimizeBakup(obj);
console.log(`Optimize :`, optimized);

const parsed = parseBackup(optimized);
console.log(`Parse :`, parsed);

// console.log(`dbObj == ParsedObj =`, JSON.stringify(obj) == JSON.stringify(parsed));
// console.log(`dbObj == SortedParsedObj =`, JSON.stringify(obj) == JSON.stringify(parsed.sort((a, b) => a.timestamp - b.timestamp)));
