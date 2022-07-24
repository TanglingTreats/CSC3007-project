const target = "Russia-Ukraine Equipment Losses - Original.csv";
const onlineTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/gviz/tq?=out:csv&sheet=Original";
const googTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/edit#gid=0";
const reader = new FileReader();

const dateSpan = document.getElementById("current-date");

const width = 1300;
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
      country: russia,
      type: type.slice(1),
    };
    let uObj = {
      x: width / 2,
      y: height / 2,
      data: parseInt(latestSet[`${ukraine + type}`]),
      r: parseInt(latestSet[`${ukraine + type}`]),
      country: ukraine,
      type: type.slice(1),
    };

    return [rObj, uObj];
  });

  const oneThirdWidth = width / 3;

  const countryColorScale = d3
    .scaleOrdinal()
    .domain([russia, ukraine])
    .range(["#FF7E7E", "#656BFF"]);

  const countryCluster = d3
    .scaleOrdinal()
    .domain([russia, ukraine])
    .range([oneThirdWidth, oneThirdWidth * 2 + oneThirdWidth / 2]);

  const zoomLevel = 0.1;
  const limit = 35;

  // Create Tooltip
  let tooltip = d3.select("#tooltip").style("opacity", 0);
  tooltip.style("top", height / 3).style("left", width / 2);

  let node = svg
    .append("g")
    .attr("id", "nodes")
    .selectAll("g")
    .data(dataPoints)
    .enter()
    .append("g");

  let circle = node
    .append("circle")
    .attr("r", (d) => d.r * zoomLevel)
    .style("fill", (d) => countryColorScale(d.country))
    .on("mouseover", (event, d) => {
      d3.select(event.target).attr("class", "circle-border");
      console.log(d);
      d3.selectAll("circle").style("opacity", (c) => {
        if (c.type !== d.type) return 0.5;
      });
      d3.selectAll("text").style("opacity", (c) => {
        if (c.type !== d.type) return 0.5;
      });
      tooltip.html(`${d.type}`).style("opacity", 1);
    })
    .on("mouseout", (event, d) => {
      d3.select(event.target).attr("class", "circle-border");
      d3.selectAll("circle").style("opacity", (c) => {
        if (c.type !== d.type) return 1;
      });
      d3.selectAll("text").style("opacity", (c) => {
        if (c.type !== d.type) return 1;
      });
      tooltip.style("opacity", 0);
    });

  let typeLabel = node
    .append("text")
    .text((d) => {
      if (d.r * zoomLevel >= limit) return `${d.type}`;
    })
    .attr("dy", "-0.5em")
    .attr("text-anchor", "middle");

  let dataLabel = node
    .append("text")
    .text((d) => {
      if (d.r * zoomLevel >= limit) return `${d.data}`;
    })
    .attr("dy", "0.5em")
    .attr("text-anchor", "middle");

  let simulation = d3
    .forceSimulation()
    .nodes(dataPoints)
    .force(
      "x",
      d3
        .forceX()
        .strength(0.1)
        .x((d) => countryCluster(d.country))
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
      //circle.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });
})();
