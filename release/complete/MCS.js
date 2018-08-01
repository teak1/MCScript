var cmds = /\/(advancement|bossbar|clear|clone|data|datapack|debug|defaultgamemode|difficulty|effect|enchant|execute|experience|fill|function|gamemode|gamerule|give|help|kick|kill|list|locate|me|msg|particle|playsound|publish|recipe|reload|replaceitem|say|scoreboard|seed|setblock|setworldspawn|spawnpoint|spreadplayers|stopsound|summon|tag|team|teleport|tell|tellraw|time|title|tp|trigger|w|weather|worldborder|xp)/g;
const fs = require("fs");
var function_names = {
	l: [],
	o: {}
};
var deleteFolderRecursive = function (path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function (file, index) {
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};
var long = true;
var libs = {};
var scores = {};
var constants = {};
var tags = {};

function makeRandomTag() {
	var tag = Math.random().toString(16).replace(/\./, "").toString(16);
	if (tags[tag]) return makeRandomTag();
	tags[tag] = true;
	return tag;
}

function parse(code, id_base = 0, namespace, name) {
	var startb = new Date().getTime();
	code = code.replace(/^[\s\t]+/g, "");
	var islib = code.match(/^#@lib/);
	var text = code;
	var lines = text.split("\n");
	var data = {};
	namespace = namespace || "build";
	data.loc = namespace;
	data.name = name || "main";
	data.f_name = name;
	data.scopes = [];
	data.nametable = {};
	if (id_base === 0) data.nametable["0"] = "main.mcfunction";
	data.functions = {};
	data.others = [];
	data.sub = {};
	data.end_text = "";
	var id_next = 0;
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].match(/^@@/)) {
			importMcsLib(lines[i].replace(/^@@/, ""));

		}
		if (lines[i].match(fuck)) {
			console.log(lines[i]);
			data.scopes.push(lines[i]);

		} else if (lines[i].match(/[{]/g) && null === lines[i].match(/^\s{0,}\//m)) {

			//			console.log(id_base, "STARTING SCOPE", lines[i]);
			var o = {
				start: i,
				end: 0,
				type: "unknown",
				id: ++id_next,
				first: lines[i],
				f_name: "",
				name: "",
				content: "UNKNOWN CONTENT",
				beg: "",
				end_text: ""
			};
			if (lines[i].match(/for/)) o.type = "for";
			if (lines[i].match(/while/)) o.type = "while";
			if (lines[i].match(/if/)) o.type = "if";
			if (lines[i].match(/else/)) o.type = "else";
			if (lines[i].match(/else if/)) o.type = "elseif";
			if (lines[i].match(/function/)) {
				o.type = "function";
				o.f_name = lines[i].replace(/function/, "").replace(/\(.+/, "").replace(/\s/g, "");
				o.name = lines[i].replace(/function/, "").replace(/\(.+/, "").replace(/[\s\n\r]/g, "");
			} else {
				o.name = o.type;
			}
			tmp = "{";
			var j = i;
			while (j < lines.length - 1) {
				j++;
				//console.log(id_base + "::", null === lines[j].match(/^\s+?\//m));
				if (lines[j].match(/}/g) && null === lines[j].match(/[^\n]\s{0,}\//g)) {
					tmp += lines[j].match(/}/g).join("");
				}
				if (lines[j].match(/{/g) && null === lines[j].match(/[^\n]\s{0,}\//g)) {
					tmp += lines[j].match(/{/g).join("");
				}
				var aa = "",
					bb = "";
				tmp.split("").find((a) => {
					a == "}" ? aa += "}" : bb += "{";
				});
				if (aa.length == bb.length || j === lines.length - 1) {
					////console.log("END::", tmp);
					o.end = j;
					if (long && !islib) {
						if (o.type === "function") {
							data.nametable[o.id] = id_base + "_" + o.type + "_" + o.id + "_" + o.f_name + ".mcfunction";
						} else {
							data.nametable[o.id] = id_base + "_" + o.type + "_" + o.id + ".mcfunction";
						}
					} else if (islib) {
						data.nametable[o.id] = o.f_name + ".mcfunction";
					} else {
						data.nametable[o.id] = id_base + "_" + o.id + ".mcfunction";
					}
					o.f_name = "build:" + (namespace || "build") + "/" + data.nametable[o.id].replace(/\.mcfunction/, "");
					if (namespace === "build" && id_base === 0) {
						function_names.l.push(data.nametable[o.id].replace(/\.mcfunction/, ""));
						function_names.o[data.nametable[o.id].replace(/\.mcfunction/, "")] = o.f_name;
					} else {
						function_names.l.push(namespace + ":" + data.nametable[o.id].replace(/\.mcfunction/, ""));
						function_names.o[namespace + ":" + data.nametable[o.id].replace(/\.mcfunction/, "")] = o.f_name;
					}
					data.scopes.push(o);
					// console.groupCollapsed(data.nametable[o.id]);
					// data.sub[data.nametable[o.id]] = parse(text.split("\n").slice(o.start + 1, o.end - o.start).join("\n"), id_base + 1);
					// console.groupEnd();
					i = j - 1;
					j = Infinity;
					//console.log("jumping to " + j);
					//console.log(JSON.stringify(o));
					continue;
				}
			}
			//console.warn(data.nametable[o.id] + ":" + tmp);
			data.functions[data.nametable[o.id]] = "#function " + (namespace || "build") + ":" + data.nametable[o.id];
			//console.log(tmp);
			//console.log("found", lines[i], o);
		} else {
			if (lines[i].match(/@@/) ||
				lines[i].match(/{/) ||
				lines[i].match(/}/)) {
				//console.log(lines[i]);
			} else {
				data.scopes.push(lines[i]);
			}
		}
	}

	for (var i = 0; i < data.scopes.length; i++) {
		if (typeof data.scopes[i] != "string") {
			if (data.scopes[i].name != "function") {
				data.scopes[i].name = data.nametable[data.scopes[i].id].replace(/\.mcfunction/, "");
			}
			var a = data.scopes[i].end
			if (a < 1) a = 1;
			var starta = new Date().getTime();
			data.scopes[i].content = text.split("\n").slice(data.scopes[i].start + 1, a).join("\n");
			//			console.log(data.name + " done in " + Math.abs(starta - new Date().getTime()) / 1000 + "s!");
			data.sub[data.nametable[data.scopes[i].id]] = parse(text.split("\n").slice(data.scopes[i].start + 1, a).join("\n"), i + "_" + id_base, namespace, data.scopes[i].name);
		}
	}

	//	if (id_base === 0) console.log("build done in " + Math.abs(startb - new Date().getTime()) / 1000 + "s!");
	return data;
}





function importMcsLib(name) {
	name = name.replace(/[\s\r\n]/g, "");
	if (libs[name]) return;
	//console.log("\"" + name + "\"")
	if (!fs.existsSync('./lib/' + name + '.mcs')) return -1;
	var content = fs.readFileSync('./lib/' + name + '.mcs', {
		encoding: "utf-8"
	});
	var start = new Date().getTime();
	if (!content.match(/Cannot GET/i)) libs[name] = parse(content, 0, name);
	//	console.log("lib build done in " + Math.abs(start - new Date().getTime()) / 1000 + "s!");
	fs.writeFileSync("./output/artifact/lib/" + name + ".json", JSON.stringify(libs[name], null, 2), {
		encoding: 'utf-8'
	});
}

function toFunction(a) {
	//console.log(JSON.stringify(a));
	//console.log(a);
	var func = [];
	var to_make = [];
	if (a.scopes) {
		for (var i = 0; i < a.scopes.length; i++) {
			if (typeof a.scopes[i] === "object") {
				//				console.log(a.scopes[i]);
				if (a.scopes[i].type === "function") {
					func.push("function " + a.scopes[i].f_name);
					if (a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.length === 0) {
						for (var ifg = 0; ifg < a.scopes[i].content.split("\v").length; ifg++) {
							a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.push(a.scopes[i].content.split("\v")[ifg]);
						}
					}

				} else if (a.scopes[i].type === "for") {
					//console.log(a.scopes[i].first);
					var min = a.scopes[i].first.match(/\(.{0,30},.{0,30}\)/)
					if (min != null) min = min[0].replace(/[\(\)]/gm, "");
					if (min === null) min = "0,0";
					var max = min.split(",")[1];
					var min = min.split(",")[0];
					//console.log(min, ",", max);
					var tag = makeRandomTag();
					//func.push(`summon armor_stand ~ ~ ~ {Tags:["loop","`+tag+`"]}`);
					var min_is_number = isNaN(Number(min));
					var max_is_number = isNaN(Number(max));
					if (!min_is_number) {
						func.push(`scoreboard players set ` + tag + ` index ` + min);
					} else {
						func.push(`scoreboard players operation ` + tag + ` index = ` + min + ``);
					}
					if (!max_is_number) {
						func.push(`scoreboard players set ` + tag + ` limit ` + max + ``);
					} else {
						func.push(`scoreboard players operation ` + tag + ` limit = ` + max + ``);
					}
					func.push(`execute as @s at @s run function ` + a.scopes[i].f_name);
					//func.push(`kill @e[tag=`+tag+`]`);
					a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.push(a.scopes[i].content.replace(/^[\s\t]{0,}\//g, "").split("\n"));
					a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.push(`scoreboard players add ` + tag + ` index 1`, `execute as @s if score ` + tag + ` index <= ` + tag + ` limit run function ${a.scopes[i].f_name}`);
					scores["index"] = "dummy";
					scores["limit"] = "dummy";
				} else if (a.scopes[i].type === "if") {
					var invert = false;
					if (a.scopes[i].first.match(/:!/)) {
						invert = true;
						a.scopes[i].first = a.scopes[i].first.replace(/:!/, ":");
					}
					var statement = a.scopes[i].first.split("(")[1].split(")")[0].split(":");
					//console.log(statement);
					var ff = statement.join("").split(" ");
					if (ff[ff.length - 1].match(/ [-0-9]{1,10} /)) {
						constants[ff[ff.length - 1]] = true;
					}

					var s;
					if (statement.length === 2) {
						s = `execute as @s if ${statement[0]} ${statement[1]} run function ${a.scopes[i].f_name}`;
						if (invert) s = `execute as @s unless ${statement[0]} ${statement[1]} run function ${a.scopes[i].f_name}`;
					} else {
						s = `execute as @s[${statement[0]}] run function ${a.scopes[i].f_name}`;
					}
					if (a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.length === 0) {
						var ss = a.scopes[i].content /*.replace(/[\n^][\s\t]{0,}\//g, "")*/ .split("\n");
						//console.log(ss);
						if (!a.scopes[i].content.match(/RETURN/)) {
							//console.log(a.scopes[i].f_name + "::" + statement);
							//console.log(s);
							//console.log(ss);
						}
						ss.forEach(vv => {
							a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"].scopes.push(vv);
						});
					}
					////console.log(a.sub[a.scopes[i].f_name.split("/")[1] + ".mcfunction"]);
					func.push(s);
				}
				//console.log("BUILD::" + a.scopes[i].f_name);

				to_make.push(a.scopes[i]);
			} else {
				//				console.log(a.scopes[i]);
				//console.log(a.scopes[i].match(new RegExp(function_names[f])), ":O::", a.scopes[i]);
				var cpc = true;
				if (a.scopes[i].match(/\/(advancement|bossbar|clear|clone|data|datapack|debug|defaultgamemode|difficulty|effect|enchant|execute|experience|fill|function|gamemode|gamerule|give|help|kick|kill|list|locate|me|msg|particle|playsound|publish|recipe|reload|replaceitem|say|scoreboard|seed|setblock|setworldspawn|spawnpoint|spreadplayers|stopsound|summon|tag|team|teleport|tell|tellraw|time|title|tp|trigger|w|weather|worldborder|xp)/g)) {
					cpc = false;
					func.push(a.scopes[i].replace(/^\s*\//g, ""));
					//					console.log("CMD::", a.f_name, a.scopes[i].replace(/^\s*\//g, ""));
				}
				if (cpc) {
					for (var f = 0; f < function_names.l.length; f++) {
						//console.log(a.scopes[i].match(new RegExp(function_names.l[f])), ":O::", a.scopes[i]);
						if (a.scopes[i].match) {
							if (null != a.scopes[i].match(new RegExp(function_names.l[f]))) {
								cpc = false;
								func.push("#" + a.scopes[i]);
								var args = a.scopes[i].match(/\(.*\)/)
								if (args) {
									args = args[0].replace(/[\(\)]/g, "").split(",");
									//									console.log(args);
									if (args != ['']) {
										for (var n = 0; n < args.length; n++) {
											//											console.log(`scoreboard players operation arg`+n+` args = ${(isNaN(Number(args[n])) ? args[n] : Number(args[n]))}`);
											func.push(`scoreboard players operation arg` + n + ` args = ${(isNaN(Number(args[n])) ? args[n] : Number(args[n]))}`);
										}
										scores["args"] = "dummy";
									}
								}

								func.push("function " + function_names.o[function_names.l[f]]);
								f = Infinity;
								continue;
							} else {}
						} else {
							//console.log(a.scopes[i]);
						}
					}
				}
				if (cpc) {
					l = a.scopes[i];
					for (var j = 0; j < Object.keys(libs).length; j++) {
						for (var k of Object.keys(libs[Object.keys(libs)[j]].nametable)) {
							//console.log(libs[Object.keys(libs)[j]].loc + "::" + libs[Object.keys(libs)[j]].nametable[k].replace(/\.mcfunction/, ""));
							l = l.replace(new RegExp(libs[Object.keys(libs)[j]].loc + "::" + libs[Object.keys(libs)[j]].nametable[k].replace(/\.mcfunction/, "")), "function " + libs[Object.keys(libs)[j]].loc + ":" + libs[Object.keys(libs)[j]].nametable[k].replace(/\.mcfunction/, ""));
						}
					}
					func.push(l); //.replace(/^\s{0,}\//gm, ""));
				}
			}
		}
		for (var ii = 0; ii < a.end_text.split("\n").length; ii++) {
			func.push(a.end_text.split("\n")[i]);
		}
		func.join("\n").split("\n");
		////console.log("--------------------\n", func);
		func = func.map(aa => {
			if (typeof aa === "object") aa = aa[0];
			if (aa && aa.match(/ [0-9]{1,10} /)) {
				aa.match(/ [-0-9]{1,10} /).forEach(bb => constants[bb.replace(/[^0-9]/g, "")] = true);
			}
			return aa ? aa.replace(/^\s{0,}\/{0,1}/g, "") : ""
		});
		//console.log(func);
		for (var i = 0; i < func.length; i++) {
			if (null === func[i].match(/set|add|remove|particle/)) {
				var x = func[i].match(/\s[-0-9]{1,10}(\s*$|[^A-Za-z0-9\/]\))|[-0-9]{1,10}\)/gm);
				//func[i] = func[i].replace(/\s[0-9]{1,10}(\s*$|[^A-Za-z0-9\/]\))|[0-9]{1,10}\)/m, "$& const").replace(/[\r\n]/m, "");
				if (x != null && x != ['']) {
					for (var b = 0; b < x.length; b++) {
						var c = x[b].replace(/[^0-9]/g, "");
						constants[c] = c;
					}
				}
			}
		}
		var folder = a.loc || "build"
		if (!fs.existsSync("./output/functions/build/functions/")) {
			fs.mkdirSync("./output/functions/build/functions/");
		}
		if (!fs.existsSync("./output/functions/build/functions/" + folder + "/")) {
			fs.mkdirSync("./output/functions/build/functions/" + folder + "/");
		}
		fs.writeFileSync("./output/functions/build/functions/" + folder + "/" + a.name + ".mcfunction", "#generated from a .mcs file!\n" + func.join("\n"), {
			encoding: "utf-8"
		});
		for (var i = 0; i < to_make.length; i++) {
			if (to_make[i].f_name) {
				var n = to_make[i].f_name.split("/")[1] + ".mcfunction";
				toFunction(a.sub[n]);
			}
		}
	} else {
		func.push(a.content);
	}
}


var namesp = "build";
var file = null;
for (var i = 0; i < process.argv.length; i++) {
	var arg = process.argv[i];
	if (arg === "-file") {
		file = process.argv[i + 1];
		namesp = file.replace(/\.mcs/g, "");
	}
	if (arg === "-build") {
		long = false;
	}
	if (arg === "-namespace") {
		namesp = process.argv[i + 1];
	}
}
if (file === null) throw new Error("expected file passed in through -file arg");

var content = fs.readFileSync("./" + file, {
	encoding: "utf-8"
});
try {
	deleteFolderRecursive(__dirname + "/output/functions");
	fs.mkdirSync(__dirname + "/output/functions/", 2);
	fs.mkdirSync(__dirname + "/output/functions/build", 2);
	fs.mkdirSync(__dirname + "/output/functions/build/functions/", 2);
} catch (e) {
	throw e;
}


var scopes = parse(content, 0, namesp);
fs.writeFileSync("./output/artifact/build.json", JSON.stringify(scopes, null, 2));
fs.writeFileSync("./output/artifact/libs.json", JSON.stringify(libs, null, 2));
toFunction(scopes);
for (var i = 0; i < Object.keys(libs).length; i++) {
	toFunction(libs[Object.keys(libs)[i]]);
}
scores["vars"] = "dummy";
if (Object.keys(constants).length > 0) scores["const"] = "dummy";
var scoreboards = Object.keys(scores);
scoreboards = scoreboards.map((a) => {
	var type = scores[a];
	return "scoreboard objectives add " + a + " " + type;
})
for (var i = 0; i < Object.keys(constants).length; i++) {
	scoreboards.push("scoreboard players set " + Object.keys(constants)[i] + " const " + Object.keys(constants)[i]);
	scoreboards.push("scoreboard players set -" + Object.keys(constants)[i] + " const -" + Object.keys(constants)[i]);
}

fs.writeFileSync("./output/functions/build/functions/init.mcfunction", scoreboards.join("\n"), {
	encoding: "utf-8"
});
//console.log(function_names);