let merge = require('deepmerge');
let fs = require('fs');
let csv = require('fast-csv');

class CSV2JSONConverter{      /*Class to manage csv data conversion to json format for selenium script input*/
  /**DESCRIPTION OF TASK:
  * INPUT (csv) :
          _A_a_x, _B_a_x, _B_b1_x, _B_b2_y, _B_b3_z, _C_a     , _D_a, _E_a1, _E_a2, _E_a3
          $a    , @b    , #c     , #d     , #e     , %f;%g;%h , %i  , %j   , %k   , %l

  * OUTPUT (json) :
          {
            A:{
              a:{
                x : "$a"
              }
            },
            B:{
              a: {
                  x: "@b"
                },
              b: [
                {x : "#c"},
                {y : "#d"},
                {z : "#e"}
              ]
            },
            C: {
              a : ["%f", "%g", "%h"]
            },
            D: {
              a : "%i"
            },
            E: {
              a : ["%j", "%k", "%l"]
            }
          }
  */

  constructor(fromPath, toPath){      /*initializes regular expressions for parsing*/
      this.fileNameRegex = /[^\.]+/g;
      this.dataRegex = /^[_][a-zA-Z0-9_]+/g;  //To separate the data variables starting with a underscore(_).
      this.levelRegex = /[a-zA-Z]+([ ]?[a-zA-Z]+)*|([0-9]+)/g;     //To separate out words separated with underscore(_)
      this.arrayRegex = /[a-zA-Z0-9\-\$\^%#@\!\\+<>()|\/_,.:?'\[\] ]+/g;       //To check if a variable is an array with all special characters except semicolon (;)
      // this.arrayRegex = /[a-zA-Z0-9 ]+/g;      //To check if a variable is an array.
      this.numRegex = /[0-9]+/g;              //To check for a number.
      this.fromPath = fromPath;
      this.toPath = toPath;
  }

  readCSV(fromPath){    /*reads a csv file from a given path and returns the data as an array.*/
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

  concatMerge(destinationArray, sourceArray, options) {     /*returns function logic for merging json arrays*/
      // destinationArray // => [1, 2, 3]
      // sourceArray // => [3, 2, 1]
      // options // => { arrayMerge: concatMerge }
      return [...new Set([...sourceArray, ...destinationArray])];
  }

  checkForArray(inString, regex = this.numRegex){      /*Checks if input string satisfies the array naming convention*/
    let arr = inString.match(regex);
    if(arr==null)
      return {isArray : false, value : arr};
    else
      return {isArray : true, value : arr[0]};
  }

  getDataVariables(data, startsWith = '_'){     /*takes a 2D array of csv data as input and returns a 2D array (where header has underscore(_) as the first character)*/
    return data[0].map((value, index)=>{
        if(value.charAt(0) == startsWith)
          return index;
      }).filter(value => {
        return value != undefined;
      }).map(value => {
        return data.map(invalue => {
          return invalue[value];
        })
      });
  }

  tokenize(values, regex = this.levelRegex){     /*Takes input of an array and returns a two-dimensional array of tokenized values*/
    return values.map(value => {
      return value.match(regex);
    });
  }

  getJSON(fromArray, assignValue){      /*Takes 1D level-wise-tokenized array and a value as input and returns a JSON object*/
    /**EXAMPLE:
    *   INPUT:
    *   fromArray = ["Component", "Diagnostics", "Header"] , assignValue = "Diagnostic"
    *
    *   OUTPUT:
    *   {
    *     COMPONENT:{
    *        Diagnostics : {
    *            Header : Diagnostic
    *        }
    *     }
    *   }
    */
    let json = {};
    let jsonObj = assignValue;
    for(let i = fromArray.length-1; i>=0; i--){
      if(typeof jsonObj == typeof ""){
        let retArr = jsonObj.match(this.arrayRegex);
        json[fromArray[i].toUpperCase()] = retArr;
      }
      else
        json[fromArray[i].toUpperCase()] = jsonObj;
      jsonObj = json;
      json = {};
    }
    return jsonObj;
  }

  arrayize(jsonObj){     /*Convert numeric key valued objects to array*/
    /**EXAMPLE:
     *    INPUT:
     *      {
     *         XYZ:{
     *            1:"x"
     *          },
     *          {
     *          2:"y"
     *        }
     *      }
     *    Output:
     *      {XYZ : ["x", "y"]}
     */
    let ind, newObj = {}, arrObj = [], r={};
    for(ind in jsonObj){
      if(typeof jsonObj[ind] == typeof {})
      jsonObj[ind] = this.arrayize(jsonObj[ind]);
      r = this.checkForArray(ind);
      if(r.isArray==true){
        let comp = [jsonObj[ind]];
        arrObj = merge(comp, arrObj, {arrayMerge:this.concatMerge});
      }else{
        let comp = {};
        comp[ind] = jsonObj[ind];
        newObj = merge(comp, newObj, {arrayMerge:this.concatMerge});
      }
    }
    if(r.isArray == true){
      return arrObj;
    }
    if(r.isArray == false){
      return newObj;
    }
    return jsonObj;
  }

  unArrayize(jsonObj){     /*Remove Array object from single string arrays*/
    /**EXAMPLE:
    INPUT1:
    {
    "X":["x"]
    }
    OUTPUT1:
    {"X":"x"}
    __________________________________________
    INPUT2:
      {
      "XYZ":["x", "y", "z"]
    }
    OUTPUT2:
    {
      "XYZ":["x", "y", "z"]
    } (no change)

    */
    let ind, r={};
    for(ind in jsonObj){
      if(typeof jsonObj[ind] == typeof {})
        this.unArrayize(jsonObj[ind]);
      if(jsonObj[ind]!=null && typeof jsonObj[ind] == typeof [] && jsonObj[ind].length ==1){
        let temp = jsonObj[ind];
        jsonObj[ind] = temp[0];
      }
    }
  }

  writeJSON(data, toPath){      /*Takes path to write json data to and returns message*/
    fs.writeFile(toPath, JSON.stringify(data,null,'\t'), err => {
      if (err)
        return {message : err};
      return {message : "success"};
      });
  }

  convert(data){      /*Takes csv data and returns json format (inclusive of MPages variable template logic)*/

    //get data after filtering unwanted variables
    let filteredData = this.getDataVariables(data);

    //convert the data into level-wise-tokenized arrays
    let twoDHeaders = this.tokenize(filteredData.map( value => {
      return value[0];
    }));

    //join all rows into json array
    let fin= {};
    for(let i = 1; i<filteredData[0].length; i++){
      let values = filteredData.map( value => {
        return value[i];
      });
      //Convert level-wise-tokenized arrays to individual json objects and merge recursively
      for(let iii = 0; iii<twoDHeaders.length; iii++){
        let jj = this.getJSON(twoDHeaders[iii], values[iii]);
        fin = merge(jj, fin, { arrayMerge: this.concatMerge });
      }
    }
    // this.writeJSON(fin, "check.json");
      fin = this.arrayize(fin);
      // console.log(JSON.stringify(fin));
      this.unArrayize(fin);
      // console.log("1");
    return fin;
  }

  convertAll(){     /*This method reads all files from the given directory path and converts them to JSON objects and writes them to JSON file path*/
    let that = this;
      return new Promise((resolve, reject) => {
      fs.readdir(that.fromPath, (err, files) => {
        if(err) resolve({message : err});
        else {
          for (let file of files) {
            let fName = file.match(that.fileNameRegex);
            fName = fName[0];
            that.readCSV(that.fromPath+file).then(data => {
              // console.log(JSON.stringify(data));
              let convertedData = that.convert(data);
              // console.log(JSON.stringify(convertedData));
              that.writeJSON(convertedData, that.toPath+fName+".json");
              resolve({message : "All files written successfully"});
            });
          }
        }
      });
    });

  }

}//End of class
module.exports = CSV2JSONConverter;


//IMPLEMENTATION
// let c = new Converter();
// fs.readdir("../data/csv",(err, files) => {
//   for (file of files) {
//     let fName = file.match(/[^\.]+/g);
//     fName = fName[0];
    //   c.readCSV('../data/csv/test.csv').then( data => {
    //   let convertedData = c.convert(data);
    //   console.log(JSON.stringify(convertedData));
    //   c.writeJSON(convertedData, "../data/json/"+fName+".json" );
    // });
//   }
// });
