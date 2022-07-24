const reader = new FileReader();
const target = "Russia-Ukraine Equipment Losses - Original.csv";

(async () => {
  // Get data from CSV File
  const res = await JSC.fetch(target);

  // Get text data from response
  const csvData = await res.text();

  // Get JSON from comma-separated CSV string
  const data = JSC.csv2Json(csvData);

  console.log(data);
})();
