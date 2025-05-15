// @ts-nocheck
function detectMob() {
   const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
   ];

   return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
   });
} function detectMob2() {
   return ((window.innerWidth <= 800) && (window.innerHeight <= 600));
}

if (isMobile || detectMob() || detectMob2()) {
   const reduce_cb = document.getElementById("reduce_pannel");
   reduce_cb.setAttribute("checked", "checked");

}
shrink_header(window.localStorage.getItem("shrink-header") == "true")
const path = window.location.pathname;
const menu = document.querySelector("#menu")
const selected = menu?.querySelector(`[href="${path}"]`)
if (selected) {
   selected.classList.add("active")
}

const range = document.querySelectorAll("input[type=range]")



function formatTime(timestamp, separator = " ") {
   if (!parseInt(timestamp)) return ""
   const d = new Date(timestamp);
   const day = d.getDay().toString().padStart(2, "0");
   const month = d.getMonth().toString().padStart(2, "0");
   const year = d.getFullYear();
   const hours = d.getHours().toString().padStart(2, "0");
   const minutes = d.getMinutes().toString().padStart(2, "0");
   return `${year}/${month}/${day}${separator}${hours}:${minutes}`
}

function addData(chart, label, newData) {
   chart.data.labels.push(label);
   chart.data.datasets.forEach((dataset) => {
      dataset.data.push(newData);
      if (dataset.backgroundSet) {

         const { bg_err, bg_warn, bg_norm, limit } = dataset.backgroundSet
         const color = newData > 0 ? newData > limit ? bg_warn : bg_norm : bg_err;
         dataset.backgroundColor.push(color)
      }
   });
   chart.update();
}

function removeData(chart, order = "pop") {
   chart.data.labels[order]();
   chart.data.datasets.forEach((dataset) => {
      dataset.data[order]();

      if (dataset.backgroundSet) {

         dataset.backgroundColor[order]()
      }
   });
   chart.update();
}

function upd() {
   let nd = d + zzz * 26000
   let n = Math.round(Math.random() * 13) + 13;
   if (Math.random() > .98) n *= 5
   addData(chart, formatTime(nd), n)
   if (chart.data.labels.length > 50) removeData(chart, "shift")
   zzz++;
}


document.addEventListener("change", (e) => {
   const target = e.target
   const data_value = target.getAttribute("data-value");
   if (data_value) {
      const max = target.getAttribute("max");
      target.setAttribute("data-value", target.value);
      target.style.setProperty('--left', `${(max - (max - target.value)) / max * 100}%`)

   }
})
range.forEach(r => {

   const max = r.getAttribute("max");
   r.setAttribute("data-value", r.value);
   r.style.setProperty('--left', `${(max - (max - r.value)) / max * 100}%`)
})


function dlCanvas(el) {
   const canvas = el.parentNode.parentNode.querySelector("canvas")
   const date = el.getAttribute("data-date");

   var dt = canvas.toDataURL('image/png', 1.0);
   el.href = dt;
   el.download = `${date.split("/").reverse().join("_")}-graph.png`
};
document.addEventListener("click", (e) => {
   target = e.target;

   action = target.getAttribute("data-action");
   switch (action) {
      case "dl-canvas":
         return dlCanvas(target)
         break;
      case "shrink-header":
         (() => {
            let sh = window.localStorage.getItem("shrink-header");
            sh = sh == 'true' ? false : true;
            window.localStorage.setItem("shrink-header", `${sh}`)
         })()
         break;
      default:
         break;
   }
})

function createGraph(canvas, datas, labels, options) {
   return new Chart(canvas, {
      type: options.type || "bar",
      data: {
         labels: labels,
         datasets: [
            {
               type: "bar",
               data: datas,
               label: "Ping",
               tension: 1,
               backgroundColor: options.backgroundColor,
               fill: true,
               borderWidth: 2,
               borderColor: options.borderColor,
               pointRadius: 1
            }
         ]
      },
      options: {
         title: options.title,
         indexAxis: options.indexAxis || "x",
         legend: {
            display: options.displayLegend || false
         },
         elements: {
            line: {
               cubicInterpolationMode: "monotone"
            }
         },
         plugins: options.plugins || {},
         scales: options.scales
      }
   })
}

function calculerStatistiqueParTranche(tableau, dureeTrancheMinutes, mode = "moyenne", alertValue = -250) {
   const resultats = {};

   for (const objet of tableau) {
      const date = new Date(objet.timestamp);
      const jour = date.toLocaleDateString();
      const minuteJour = date.getHours() * 60 + date.getMinutes(); // Minutes depuis le début du jour
      const tranche = Math.floor(minuteJour / dureeTrancheMinutes);
      let valeur = objet.value;
      if (valeur == "unknown") valeur = alertValue;
      if (!isIntValid(valeur) || valeur === null || isNaN(valeur)) return;
      if (!resultats[jour]) {
         resultats[jour] = [];
      }

      if (!resultats[jour][tranche]) {
         resultats[jour][tranche] = {
            valeurs: []
         };
      }
      resultats[jour][tranche].valeurs.push(parseInt(valeur));
   }

   // Fonction pour calculer la médiane
   function calculerMediane(liste) {
      const sorted = [...liste].sort((a, b) => a - b);
      const milieu = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
         ? (sorted[milieu - 1] + sorted[milieu]) / 2
         : sorted[milieu];
   }

   // Calcul des statistiques selon le mode choisi
   for (const jour in resultats) {
      const nombreTranches = Math.ceil(1440 / dureeTrancheMinutes); // 1440 minutes par jour
      for (let i = 0; i < nombreTranches; i++) {
         if (resultats[jour][i] && resultats[jour][i].valeurs.length > 0) {
            const valeurs = resultats[jour][i].valeurs;

            switch (mode) {
               case "moyenne":
                  resultats[jour][i] = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
                  break;
               case "mediane":
                  resultats[jour][i] = calculerMediane(valeurs);
                  break;
               case "max":
                  resultats[jour][i] = Math.max(...valeurs);
                  break;
               case "min":
                  resultats[jour][i] = Math.min(...valeurs);
                  break;
               case "somme":
                  resultats[jour][i] = valeurs.reduce((a, b) => a + b, 0);
                  break;
               default:
                  throw new Error(`Mode inconnu : ${mode}`);
            }
         } else {
            resultats[jour][i] = null;
         }
      }
   }

   return resultats;
}

function convertirEnHeure(nombre, tranche = 30) {
   if (nombre < 0 || nombre > ((1440 / tranche) - 1)) {
      return "Nombre invalide";
   }

   const heures = Math.floor(nombre / (60 / tranche));
   const minutes = (nombre % (60 / tranche)) * tranche;

   const heuresStr = heures.toString().padStart(2, '0');
   const minutesStr = minutes.toString().padStart(2, '0');

   return `${heuresStr}:${minutesStr}`;
}


function isIntValid(int) {
   if (int === null) return false
   if (int === undefined) return false
   if (int === false) return false
   return true
}

const caulcateDuration = (time) => {
   const days = Math.floor(time / 86400);
   const hours = Math.floor((time - (days * 86400)) / 3600) % 24
   const minutes = Math.floor((time - (hours * 3600)) / 60) % 60
   const seconds = ((time % 86400) % 3600) % 60
   const dformat = new Intl.DurationFormat("fr", { style: "narrow" }).format({ days, hours, minutes, seconds })
   return dformat;
}

const duractions = document.querySelectorAll("[data-duration]");
duractions.forEach(duration => {
   console.log(duration);

   const time = Math.round(duration.getAttribute("data-duration"));
   const dformat = caulcateDuration(time)
   duration.innerHTML = `${dformat}`
})