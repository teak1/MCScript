function clmp(n) {
	if (n < -2147483648) return -2147483648;
	if (n > 2147483647) return 2147483647;
	return n;
}

function G(a) {
	S = "";
	for (var i = 0; i < 360; i++) {
		if (i % 5 != 0) {
			S += "\n";
		} else if (i != 0) {
			S += "\n}\nif(score:g vars = " + i / 5 + " const){\n";
		} else {
			S += "if(score:g vars = " + i / 5 + " const){\n";
		}
		S += `if(score:angle vars = ${i} const){
		/scoreboard players set RETURN vars ${clmp(isNaN(Math[a](i / 180 * Math.PI)) ? 0 : Math.round((Math[a](i / 180 * Math.PI) * 10000)))}
	}`;
	}

	return S;
}

function GEN() {
	S = "#@lib\n";
	SYM = ["sin", "cos", "asin", "acos", "tan", "atan", "asinh", "acosh"];
	for (var i = 0; i < SYM.length; i++) {
		S += `\nfunction ${SYM[i]}(){
			/scoreboard players operation angle vars = arg0 args
			/scoreboard players operation angle vars %= 360 const
			/scoreboard players operation g vars = angle vars
			/scoreboard players operation g vars /= 5 const
			${G(SYM[i])}
		}
	}`
	}

	return S;
}
require("fs").writeFileSync("./trig_math.mcs", GEN());