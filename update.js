let Converter = require('./classes/converter.js');
let jsonHelper = require('./classes/jsonHelper.js');

let jh = new jsonHelper();
let jsonObj = require('./data/json/diagnostic_doc.json');

let c = new Converter();
c.readCSV('./data/csv/autogen/diagnostic_doc.csv').then(data => {
  //get data after filtering unwanted variables
  let filteredData = c.getDataVariables(data);

  //convert the data into level-wise-tokenized arrays
  let twoDHeaders = c.tokenize(filteredData.map( value => {
    return value[0];
  }));
let values =[];
  // console.log(twoDHeaders);
  for(let i = 1; i<filteredData[0].length; i++){
    values = filteredData.map( value => {
      return value[i];
    });
  }
  // console.log(values);
  let convertedData = jh.updateKeyPaths(jsonObj,twoDHeaders,values);
  console.log(JSON.stringify(convertedData));
  c.writeJSON(convertedData, "./data/json/diagnostic_doc.json");
});
