
class jsonHelper{
  constructor(){
  }

  AddNewKeyIfNotExists(jsonObj, keyPath, value){     /*Updates jsonObject based on the path provided and the given value*/

    if(keyPath.length==1){      //base case when we have reached final object to assign value to
      if(jsonObj[keyPath[0].toUpperCase()]==undefined)
        jsonObj[keyPath[0].toUpperCase()] = value;
      console.log(jsonObj[keyPath[0].toUpperCase()]);
    }
    else {      //when more levels are remaining
      let childObj = jsonObj[keyPath[0].toUpperCase()];
      let newKeyPath = keyPath;
      newKeyPath.shift();
      if(typeof childObj == typeof []){
        for(let i = 0; i<childObj.length; i++){
          this.AddNewKeyIfNotExists(childObj[i], newKeyPath, value);
        }
      }
      else {
        this.AddNewKeyIfNotExists(childObj, newKeyPath, value);
      }
    }
  }

  updateKeyPath(jsonObj, keyPath, value){     /*Updates jsonObject based on the path provided and the given value*/
    /**EXAMPLE:
    * INPUT:
      jsonObj = {
                  A:{
                    a : {
                      x : 4
                    }
                  },
                  B : 5
                }
      keyPath = ["A", "a", "x"]
      value = 6

    *  OUTPUT:
      jsonObj = {
                  A:{
                    a : {
                      x : 6
                    }
                  },
                  B : 5
                }
    */

    if(keyPath.length==1){      //base case when we have reached final object to assign value to
      jsonObj[keyPath[0].toUpperCase()] = value;
      console.log(jsonObj[keyPath[0].toUpperCase()]);
    }
    else {      //when more levels are remaining
      let childObj = jsonObj[keyPath[0].toUpperCase()];
      let newKeyPath = keyPath;
      newKeyPath.shift();
      if(typeof childObj == typeof []){
        for(let i = 0; i<childObj.length; i++){
          this.updateKeyPath(childObj[i], newKeyPath, value);
        }
      }
      else {
        this.updateKeyPath(childObj, newKeyPath, value);
      }
    }
  }

  updateKeyPaths(jsonObj, keyPaths, values){      /*Updates jsonObject based on all values and paths given as input*/
    /**EXAMPLE:
    * INPUT:
      jsonObj = {
                  A:{
                    a : {
                      x : 4
                    }
                  },
                  B : 5
                }
      keyPath = [["A", "a", "x"],["B"]]
      value = [6,1]

    *  OUTPUT:
      jsonObj = {
                  A:{
                    a : {
                      x : 6
                    }
                  },
                  B : 1
                }
    */
    for(let i=0; i<values.length; i++){
      if(values[i]!=null)
        this.updateKeyPath(jsonObj, keyPaths[i], values[i]);
    }
    return jsonObj;
  }

  updateValue(jsonObj, keys, values, regex = ''){     /*Updates jsonObject based on the keys and corresponding values and optional regex of existing value if any*/
    /**EXAMPLE
    */

    for(let key in jsonObj){      //Depth First Traverse through the jsonObject
      if(typeof keys == typeof [] && typeof values == typeof []){     //(input are [])
        if(keys.indexOf(key)!=-1){      //(array input) && (key matches)
          if(regex == ''){      //(array input) && (key matches) && (No regex)
            jsonObj[key] = values[keys.indexOf(key)];
          }
          else if (regex != '') {     //(array input) && (key matches) && (with regex)
            if(typeof jsonObj[key] == typeof []){     //(array input) && (key matches) && (with regex) && (modifying obj is [])
              for (let ind in jsonObj[key]) {
                let result = jsonObj[key][ind].match(regex);
                if(result!=null){     // (array input) && (key matches) && (with regex) && (modifying obj is []) && (regex matches)
                  jsonObj[key][ind] = values[keys.indexOf(key)];
                }
              }
            }
            else{     //(array input) && (key matches) && (with regex) && (modifying obj is not [])
              let result = jsonObj[key].match(regex);
              // console.log(result);
              if(result!=null){     //(array input) && (key matches) && (with regex) && (modifying obj is not []) && (regex matches)
                jsonObj[key] = values[keys.indexOf(key)];
              }
            }
          }
        }
      }
      else if (typeof keys == typeof "" && typeof values == typeof "") {      //(input are "")
        if(keys==key){      //("" input) && (key match)
          if(regex==''){      //("" input) && (key match) && (no regex)
            jsonObj[key] = values;
          }
          else{     //("" input) && (key match) && (with regex)
            if(typeof jsonObj[key] == typeof []){     //("" input) && (key match) && (with regex) && (modifying object is [])
              for (let ind in jsonObj[key]) {
                let result = jsonObj[key][ind].match(regex);
                if(result!=null){     //("" input) && (key match) && (with regex) && (modifying object is []) && (regex matches)
                  jsonObj[key][ind] = values;
                }
              }
            }
            else{     //("" input) && (key match) && (with regex) && (modifying object is not [])
              let result = jsonObj[key].match(regex);
              if(result!=null){     //("" input) && (key match) && (with regex) && (modifying object is not []) && (regex matches)
                jsonObj[key] = values;
              }
            }
          }
        }
      }
      if(typeof jsonObj[key] != typeof "")
        this.updateValue(jsonObj[key], keys, values,regex);
    }
    return jsonObj;
  }

  sortJsonArray(jsonObj, compare=(obj1, obj2)=>obj1<obj2){
    if(typeof jsonObj == typeof []){
      for(let ind1 = 0; ind1<jsonObj.length; ind1++){
        for(let ind2 = ind1+1; ind2<jsonObj.length; ind2++){
          if(compare(jsonObj[ind1],jsonObj[ind2])==false){
            let obj = jsonObj[ind1];
            jsonObj[ind1] = jsonObj[ind2];
            jsonObj[ind2] = obj;
          }
        }
      }
      return {"success": true, "result": jsonObj, "message" : "Array sorted"};
    }
    else {
      return {"success": false, "result":jsonObj, "message" : "Object not an array"};
    }
  }
}

module.exports = jsonHelper;

// let jh = new jsonHelper();
// let obj = { KEY1 : [{"B":"bca"},{"A":"abc"},{"A":"acb"}]}
// let obj = { level1: {level2 : {key1 : ["val1","11/11/2011","34"], key2 : ["val2", "12/12/2012"] }, level22 : "val22"}}
// console.log(obj["level1"]["level2"]["key1"]["0"]);
// console.log(JSON.stringify(jh.updateValue(obj, "key1", "03/12/3014", "[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]")));
// console.log(JSON.stringify(jh.updateValue(obj, ["key1", "key2"], ["03/12/3014", "13/12/3114"], "[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]")));
// console.log(JSON.stringify(jh.updateValue(obj, "level22", "03/12/3414", "[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]")));

// jh.AddNewKeyIfNotExists(obj, ["KEY1","A"], 44);
// console.log(JSON.stringify(obj));
// obj["key1"]=(jh.sortJsonArray(obj.key1, (o,p)=>{
//   return o.a < p.a
// })).result;
// console.log(JSON.stringify(obj,null,"\t"));
