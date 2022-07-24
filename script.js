const target = "Russia-Ukraine Equipment Losses - Original.csv";
const reader = new FileReader();

const dateSpan = document.getElementById("current-date");

function formatDate(date) {
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("en-SG", options);
}

function displayDate(date) {
  console.log(date);
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

  console.log(data);
  const latestSet = data[data.length - 1];

  console.log(latestSet);

  displayDate(formatDate(new Date(latestSet.Date)));
})();
