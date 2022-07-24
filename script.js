const reader = new FileReader();
const target = "Russia-Ukraine Equipment Losses - Original.csv";

(async () => {
  const res = await fetch(target, {
    method: "get",
    headers: {
      "content-type": "text/csv;charset=UTF-8",
    },
  });

  const csvString = await res.text();

  const data = d3.csvParse(csvString);

  console.log(data);
})();
