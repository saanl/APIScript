const https = require('https');
const program = require('commander');
var moment = require('moment')
//var argv = require('optimist').argv;


program
  .option('-a, --app <OwnerName>/<AppName>', 'OwnerName/AppName')
  .option('-t, --token <token>', 'api token')
  .option('-v, --ver <version>', 'choose version')
  .option('-s, --short_version <short_version>', 'choose short_version')
  .option('-d, --date <StartDate>/<EndDate>', 'the date between start and end after you have selected the version, time format: YYYY-MM-DD HH:mm:ss')
  .option('--sep, --separator <separator>', 'print separator')
  .option('--debug, --debug', 'show verbose log');
  
program.parse(process.argv);

let debug = program.debug
let app = ''
let token = ''
let version = ''
let name = ''
let dates = ''
let separator = ' '

if(program.app !== undefined){
	app = program.app
}else{
	console.log('Error: need -a command')
	process.exit(-1);
}

if(program.token !== undefined){
	token = program.token
}else{
	console.log('Error: need -t command')
	process.exit(-1);
}

if(program.ver !== undefined){
	version = program.ver
}

if(program.short_version !== undefined){
	name = program.short_version
}

if(program.date !== undefined){
	dates = program.date
}

if(program.separator !== undefined){
	separator = program.separator
}

if(program.ver == undefined && program.short_version == undefined){
	console.log('Error: need -v or -s command')
	process.exit(-1);
}


if(debug){
	console.log(` app: ${app}, \n token: ${token}, \n version:${version}, \n short_version:${name}`);
	console.log("\n")
}


const options = {
  hostname: 'api.appcenter.ms',
  port: 443,
  path: '/v0.1/apps/'+app+'/releases',
  headers: {
         'X-API-Token': token,
  },
  method: 'GET'
};

const req = https.request(options, (res) => {
	if(debug){
		console.log("param: \n", options)
		console.log("\n")
	}
	if(res.statusCode == 200){
		let body = '';
		res.on("data", function(chunk) {			
			const data = JSON.parse(body+chunk)
			if(debug){
				console.log('json data:', JSON.stringify(data));
				console.log("\n")
			}
			isarr = Array.isArray(data);
			if(!isarr){
				console.log('response format error: not array!');
			}else{
				const id = findReleasId(version,name,data);
				let result = [];
				id.forEach(val => {result.push(val)})
				const betweens = getData(dates)
				if(betweens.length != 0){
					const lastReresult = result.filter((val,index,arr)=>{
						return dataCompare(betweens, val.uploaded_at)
					});
					printArr(lastReresult,separator);
				}else{
					printArr(result,separator);
				}
				
			}
		});
	}else{
		console.log('statusCode: ', res.statusCode);
	}
  
});

req.on('error', (e) => {
  console.error(e);
});

req.end();

function findReleasId(version,name,data){
	
	if( (version !== undefined && name !== undefined) && (version !== '' && name !== '') ){
		//console.log("1");
		return data.filter((val,index,arr) => {return val.version == version && val.short_version == name});
	}
	
	if(version !== undefined && version != ''){
		//console.log("2");
		return data.filter((val,index,arr) => {return val.version == version});
	}
	
	if(name !== undefined && name !== ''){
		//console.log("3");
		return data.filter((val,index,arr) => {return val.short_version == name});
	}
	
	return undefined
}

function getData(date_string){
	
	if(date_string !== undefined && date_string!== ''){
		const date_str_arr = date_string.split("/")
		if(date_str_arr.length == 2){
			isCompare = moment(date_str_arr[0]).isBefore(date_str_arr[1]);
			if(isCompare){
				return [date_str_arr[0],date_str_arr[1]];
			}
			return [date_str_arr[1],date_str_arr[0]];;
		}else{
			console.log('Eorror: data format error')
		}
		
	}
	
	return []
	
}

function dataCompare(date_between,target){
	const tar = moment(target, "YYYY-MM-DD HH:mm:ss");
	if(debug){
		//console.log(tar)
	}
	return moment(tar).isBetween(date_between[0], date_between[1], 'seconds');
}

function printArr(objArr,separator){
	let arr = []
	objArr.forEach( val => {
		arr.push(val.id);
	});
	
	const reg = new RegExp(',', 'g');
	const str = arr.join()
	const re = str.replace(reg, separator);
	console.log(re)
}
