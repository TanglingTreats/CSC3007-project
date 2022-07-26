const target = "Russia-Ukraine Equipment Losses - Original.csv";
const onlineTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/gviz/tq?=out:csv&sheet=Original";
const googTarget =
  "https://docs.google.com/spreadsheets/d/1bngHbR0YPS7XH1oSA1VxoL4R34z60SJcR3NxguZM9GI/edit#gid=0";
const reader = new FileReader();

const dateSpan = document.getElementById("current-date");
const filters = document.getElementById("filters");
const dateSlider = document.getElementById("date-slider");

let currFilter = ["all"];
let selectedDate = "";
let totalData = [];
let dataPoints = [];

const width = 1300;
const height = 600;

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
    console.log(checkbox.value);
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

  displayData(filteredDataPoints);
}

function displayData(filteredDataPoints) {
  svg.selectAll("g").remove();
  let node = svg
    .append("g")
    .attr("id", "nodes")
    .selectAll("g")
    .data(filteredDataPoints)
    .enter()
    .append("g");

  let circle = node
    .append("circle")
    .attr("r", (d) => d.r * zoomLevel)
    .style("fill", (d) => countryColorScale(d.country))
    .on("mouseover", (event, d) => {
      d3.select(event.target).attr("class", "circle-border");
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
    .nodes(filteredDataPoints)
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
}

function formatData(data) {
  // Form data of
  // {
  //    date: ""
  //    data: []
  // }
  const formattedData = data.flatMap((obj) => {
    let rObj = {};
    let uObj = {};
    const dObj = {};
    const dArray = [];
    for (let i in unitTypes) {
      const type = unitTypes[i];
      rObj = {
        x: width / 2,
        y: height / 2,
        data: parseInt(obj[`${russia + type}`]),
        r: parseInt(obj[`${russia + type}`]),
        country: russia,
        type: type.slice(1),
      };
      uObj = {
        x: width / 2,
        y: height / 2,
        data: parseInt(obj[`${ukraine + type}`]),
        r: parseInt(obj[`${ukraine + type}`]),
        country: ukraine,
        type: type.slice(1),
      };

      dArray.push(rObj, uObj);
    }

    dObj.date = obj["Date"];
    dObj.data = dArray;

    return dObj;
  });

  return formattedData;
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

  console.log(data);
  // Format data
  totalData = formatData(data);
  const latestSet = totalData[totalData.length - 1];

  // Set slider attributes
  dateSlider.setAttribute("max", totalData.length);
  dateSlider.value = totalData.length;
  dateSlider.oninput = (event) => {
    const sliderValue = event.target.value - 1;
    selectedDate = totalData[sliderValue].date;
    displayDate(formatDate(new Date(selectedDate)));
    dataPoints = totalData[sliderValue];
    filterData();
  };

  // Set latest date
  selectedDate = latestSet.date;
  displayDate(formatDate(new Date(selectedDate)));
  createFilters();

  // Set global data points to use
  dataPoints = latestSet;
  filterData();
})();
