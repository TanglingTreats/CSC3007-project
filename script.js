const target = "Russia-Ukraine Equipment Losses - Original.csv";
const onlineTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/gviz/tq?=out:csv&sheet=Original";
const googTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/edit#gid=0";
const reader = new FileReader();

const dateSpan = document.getElementById("current-date");
const filters = document.getElementById("filters");
const dateSlider = document.getElementById("date-slider");
dateSlider.value = 50;

let currFilter = ["all"];
let selectedDate = "";
let totalData = [];
let dataPoints = [];
let filteredData = [];

let isInit = true;

const limit = 35;

const width = 1300;
const height = 600;

const oneThirdWidth = width / 3;

const russiaOrigin = {
  x: oneThirdWidth,
  y: height / 2,
};

const ukraineOrigin = {
  x: oneThirdWidth * 2 + oneThirdWidth / 2,
  y: height / 2,
};

let svg = d3.select("svg").attr("width", width).attr("height", height);

// Create Tooltip
const tooltip = d3.select("#tooltip").style("opacity", 0);
tooltip.style("top", height / 3).style("left", width / 2);

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

const formatType = [...unitTypes, `_Total`];

const countryColorScale = d3
  .scaleOrdinal()
  .domain([russia, ukraine])
  .range(["#FF7E7E", "#656BFF"]);

const countryCluster = d3
  .scaleOrdinal()
  .domain([russia, ukraine])
  .range([russiaOrigin.x, ukraineOrigin.x]);

let zoomScale;

// d3 elements
let node;
let simulation;
let nodeG;

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

function checkboxFunction(event) {
  const checkboxes = Array.from(document.getElementsByClassName("checkbox"));
  const checkbox = event.target;

  if (checkbox.checked && checkbox.value === "all") {
    let checked_checkboxes = checkboxes.filter(
      (checkbox) => checkbox.value !== "all" && checkbox.checked
    );

    for (let i in checked_checkboxes) {
      checked_checkboxes[i].checked = false;
      const filterArrIndex = currFilter.indexOf(checked_checkboxes[i].value);

      if (filterArrIndex !== -1) {
        currFilter.splice(filterArrIndex, 1);
      }
    }
  } else {
    let allCheckbox = checkboxes.find((checkbox) => checkbox.value === "all");

    // Get all uncheckedBoxes
    let uncheckedBoxes = checkboxes.find((checkbox) => checkbox.checked);

    allCheckbox.checked = false;
    const allIndex = currFilter.indexOf("all");
    if (allIndex !== -1) currFilter.splice(allIndex, 1);

    if (uncheckedBoxes === undefined) {
      allCheckbox.checked = true;

      if (checkbox.value !== "all") currFilter.push(allCheckbox.value);
    }
  }

  if (checkbox.checked) {
    currFilter.push(checkbox.value);
  } else {
    const uncheckedBoxIndex = currFilter.indexOf(checkbox.value);
    currFilter.splice(uncheckedBoxIndex, 1);
  }

  filterData();
}

function createFilters() {
  // Create all
  const type = "All";
  const checkbox = document.createElement("input");
  checkbox.id = type.toLowerCase();
  checkbox.classList.add("checkbox");
  checkbox.type = "checkbox";
  checkbox.value = type.toLowerCase();
  checkbox.name = type.toLowerCase();
  checkbox.checked = true;
  checkbox.onclick = checkboxFunction;

  const checkboxLabel = document.createElement("label");
  checkboxLabel.setAttribute("for", type.toLowerCase());
  checkboxLabel.innerHTML = type;

  filters.appendChild(checkbox);
  filters.appendChild(checkboxLabel);

  // Create unit types
  for (let i in unitTypes) {
    const type = unitTypes[i].slice(1);
    const checkbox = document.createElement("input");
    checkbox.id = type.toLowerCase();
    checkbox.classList.add("checkbox");
    checkbox.type = "checkbox";
    checkbox.value = type.toLowerCase();
    checkbox.name = type.toLowerCase();
    checkbox.onclick = checkboxFunction;

    const checkboxLabel = document.createElement("label");
    checkboxLabel.setAttribute("for", type.toLowerCase());
    checkboxLabel.innerHTML = type;

    filters.appendChild(checkbox);
    filters.appendChild(checkboxLabel);
  }
}

function filterData() {
  const data = dataPoints.data;
  const filteredDataPoints = data.filter(
    (point) =>
      currFilter.indexOf("all") > -1 ||
      (currFilter.indexOf("all") === -1 &&
        currFilter.indexOf(point.type.toLowerCase()) > -1)
  );

  if (isInit) initChart(filteredDataPoints);
  isInit = false;
  displayData(filteredDataPoints);
}

function initChart(data) {
  //svg.select("g").append("g").attr("id", "nodes");
  simulation = d3
    .forceSimulation(data)
    .force(
      "x",
      d3
        .forceX()
        .strength(0.08)
        .x((d) => countryCluster(d.country))
    )
    .force(
      "y",
      d3
        .forceY()
        .strength(0.08)
        .y(height / 2)
    )
    .force("charge", d3.forceManyBody().strength(20))
    .force(
      "collide",
      d3
        .forceCollide()
        .strength(1)
        .radius((d) => zoomScale(d.data))
    )
    .alphaTarget(0.3)
    .on("tick", ticking);
}

function displayData(filteredDataPoints) {
  node = svg.selectAll("g").data(filteredDataPoints, (d) => d.id);

  nodeG = node.join(
    (enter) => {
      let g = enter
        .append("g")
        .on("mouseover", (event, d) => {
          d3.select(event.target).attr("class", "circle-border");
          d3.selectAll("circle").style("opacity", (c) => {
            if (c.type !== d.type) return 0.5;
          });
          d3.selectAll("text").style("opacity", (c) => {
            if (c.type !== d.type) return 0.5;
          });
          tooltip.html(`${d.type} ${d.data}`).style("opacity", 1);
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

      g.append("circle")
        .attr("id", (d) => d.id)
        .attr("r", (d) => {
          const size = zoomScale(d.data);
          return size;
        })
        .style("fill", (d) => countryColorScale(d.country));

      g.append("text")
        .attr("class", "type-label")
        .text((d) => {
          if (zoomScale(d.data) >= limit) return `${d.type}`;
        })
        .attr("dy", "-0.5em")
        .attr("text-anchor", "middle");

      g.append("text")
        .attr("class", "type-value")
        .text((d) => {
          return `${d.data}`;
        })
        .attr("dy", "0.5em")
        .attr("text-anchor", "middle");

      return g;
    },
    (update) => {
      update
        .select("g")
        .on("mouseover", (event, d) => {
          d3.select(event.target).attr("class", "circle-border");
          d3.selectAll("circle").style("opacity", (c) => {
            if (c.type !== d.type) return 0.5;
          });
          d3.selectAll("text").style("opacity", (c) => {
            if (c.type !== d.type) return 0.5;
          });
          tooltip.html(`${d.type} ${d.data}`).style("opacity", 1);
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
      update.select("circle").attr("r", (d) => {
        const size = zoomScale(d.data);
        return size;
      });
      update.select(".type-label").text((d) => {
        if (zoomScale(d.data) >= limit) {
          return d.type;
        }
      });
      update.select(".type-value").text((d) => {
        return d.data;
      });
      return update;
    }
  );

  simulation.nodes(filteredDataPoints).force(
    "collide",
    d3
      .forceCollide()
      .strength(1)
      .radius((d) => zoomScale(d.data))
      .iterations(1)
  );
}

function ticking() {
  nodeG.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
}

function formatData(data) {
  // Form data of
  // {
  //    date: ""
  //    data: []
  // }

  const minMaxArray = [];
  const formattedData = data.flatMap((obj) => {
    let rObj = {};
    let uObj = {};
    const dObj = {};
    const dArray = [];
    for (let i in unitTypes) {
      const type = unitTypes[i];
      rObj = {
        id: `${russia + type}`,
        x: russiaOrigin.x,
        y: russiaOrigin.y,
        data: parseInt(obj[`${russia + type}`]),
        country: russia,
        type: type.slice(1),
      };
      uObj = {
        id: `${ukraine + type}`,
        x: ukraineOrigin.x,
        y: ukraineOrigin.y,
        data: parseInt(obj[`${ukraine + type}`]),
        country: ukraine,
        type: type.slice(1),
      };

      dArray.push(rObj, uObj);
    }

    dObj.date = obj["Date"];
    dObj.data = dArray;

    const valArray = dArray.map((val) => val.data);
    minMaxArray.push(...valArray);

    return dObj;
  });
  const min = Math.min(...minMaxArray);
  const max = Math.max(...minMaxArray);

  return [formattedData, min, max];
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

  // Format data
  const [totalData, min, max] = formatData(data);

  // Set slider attributes
  dateSlider.setAttribute("max", totalData.length);
  dateSlider.oninput = (event) => {
    const sliderValue = event.target.value - 1;
    selectedDate = totalData[sliderValue].date;
    displayDate(formatDate(new Date(selectedDate)));
    dataPoints = totalData[sliderValue];
    filterData();
  };

  zoomScale = d3.scaleLinear().domain([min, max]).range([11, 250]);

  // Set latest date
  selectedDate = totalData[dateSlider.value - 1].date;
  displayDate(formatDate(new Date(selectedDate)));
  createFilters();

  // Set global data points to use
  dataPoints = totalData[dateSlider.value - 1];
  filterData();
})();
