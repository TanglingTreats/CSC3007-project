const target = "Russia-Ukraine Equipment Losses - Original.csv";
const onlineTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/gviz/tq?=out:csv&sheet=Original";
const googTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/edit#gid=0";
const reader = new FileReader();

const dateSpan = document.getElementById("current-date");

const width = 800;
const height = 600;

let svg = d3.select("svg").attr("width", width).attr("height", height);

const russia = "Russia";
const ukraine = "Ukraine";

const unitTypes = [
  `_Aircraft`,
  `_Antiair`,
  `_Armor`,
  `_Infantry`,
  `_Logistics`,
  `_Vehicles`,
];

// Format date in the form of DD MMM YYYY
function formatDate(date) {
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("en-SG", options);
}

// Set date to element
function displayDate(date) {
  dateSpan.innerText = date;
}

(async () => {
  const res = await fetch(target, {
    method: "get",
    headers: {
      "content-type": "text/csv;charset=UTF-8",
    },
  });

  // Get CSV string from response
  const csvString = await res.text();

  // Get JSON from csv string
  const data = d3.csvParse(csvString);

  const latestSet = data[data.length - 1];

  console.log(latestSet);

  displayDate(formatDate(new Date(latestSet.Date)));

  // Create data point objects to pass into d3
  const dataPoints = unitTypes.flatMap((type) => {
    let rObj = {
      x: width / 2,
      y: height / 2,
      data: parseInt(latestSet[`${russia + type}`]),
      r: parseInt(latestSet[`${russia + type}`]),
      class: russia,
      type: type.slice(1),
    };
    let uObj = {
      x: width / 2,
      y: height / 2,
      data: parseInt(latestSet[`${ukraine + type}`]),
      r: parseInt(latestSet[`${ukraine + type}`]),
      class: ukraine,
      type: type.slice(1),
    };

    return [rObj, uObj];
  });

  console.log(dataPoints);

  const countryColorScale = d3
    .scaleOrdinal()
    .domain([russia, ukraine])
    .range(["#FF7E7E", "#656BFF"]);

  let node = svg
    .append("g")
    .attr("id", "nodes")
    .selectAll("circle")
    .data(dataPoints)
    .enter()
    .append("circle")
    .attr("r", (d) => d.r * 0.1)
    .style("fill", (d) => countryColorScale(d.class));

  let simulation = d3
    .forceSimulation()
    .nodes(dataPoints)
    .force(
      "x",
      d3
        .forceX()
        .strength(0.1)
        .x(width / 2)
    )
    .force(
      "y",
      d3
        .forceY()
        .strength(0.1)
        .y(height / 2)
    )
    .force("charge", d3.forceManyBody().strength(10))
    .force(
      "collide",
      d3
        .forceCollide()
        .strength(1)
        .radius((d) => d.r * 0.1)
    )
    .on("tick", (d) => {
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });
})();
