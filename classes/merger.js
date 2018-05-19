let fs = require('fs');
let csv = require('fast-csv');

class Merge{
  constructor(){

  }

  readCSV(fromPath){
    let stream = fs.createReadStream(fromPath);
    return new Promise(function(resolve, reject) {
      let dat = [];
      csv.fromStream(stream, {headers : false})
        .on("data", data => {
          dat.push(data);
        })
        .on("end", () => {
          resolve(dat);
        });
    });
  }

  mergeCsv(filePath1, filePath2){     /*Reads two CSV files and returns combined array of content*/
    let that = this;
    return new Promise(function(resolve, reject) {
      that.readCSV(filePath1).then(data1=>{
        that.readCSV(filePath2).then(data2=>{
          let data3 = [];
          for(let ind in data2){
            let datatmp = data1[ind];
            datatmp=datatmp.concat(data2[ind]);
            data3[ind] = datatmp;
          }
          resolve(data3);
        });
      });
    });
  }

  writeCsvData(data, toFilePath){
      let ws = fs.createWriteStream(toFilePath);
      csv.write(data,{headers:true}).pipe(ws);
  }
}

module.exports = Merge;
