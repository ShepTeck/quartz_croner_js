function quartzCronerFunctions() {

	(function(global, factory) {
		typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.Cron = factory())
	})(this, function() {
	  
	var maxRecordLevels = PropertiesService.getScriptProperties().getProperty('maxRecordLevels');
	var timesThroughRecursion = 0;																							 
								  
	  
	
	/////////////////////////////////////
	// Aaron Sheppard's Quartz Croner JS
	// Modified version: 07-19-2023
	//
	// Updated version of the hexagon.github croner.js
	// full credit for originals to the authors
	// Croner - MIT License - Hexagon <github.com/Hexagon>
	//
	// Modified to accept Quartz Cron format with text weekdays
	// as a stand-alone JS for use in Google Aps Script
	// without any import or dependecies
	////////////////////////////////////
	
	
	
	 function minitz(y, m, d, h, i, s, tz, throwOnInvalid) {
		return minitz.fromTZ(minitz.tp(y, m, d, h, i, s, tz), throwOnInvalid);
	}
	
	
	minitz.fromTZISO = (localTimeStr, tz, throwOnInvalid) => {
		return minitz.fromTZ(parseISOLocal(localTimeStr, tz), throwOnInvalid);
	};
	
	
	minitz.fromTZ = function(tp, throwOnInvalid) {
	
		const
	
			// Construct a fake Date object with UTC date/time set to local date/time in source timezone
			inDate = new Date(Date.UTC(
				tp.y,
				tp.m - 1,
				tp.d,
				tp.h,
				tp.i,
				tp.s
			)),
	
			// Get offset between UTC and source timezone
			offset = getTimezoneOffset(tp.tz, inDate),
	
			// Remove offset from inDate to hopefully get a true date object
			dateGuess = new Date(inDate.getTime() - offset),
	
			// Get offset between UTC and guessed time in target timezone
			dateOffsGuess = getTimezoneOffset(tp.tz, dateGuess);
	
		// If offset between guessed true date object and UTC matches initial calculation, the guess
		// was spot on
		if ((dateOffsGuess - offset) === 0) {
			return dateGuess;
		} else {
			// Not quite there yet, make a second try on guessing the local time, adjust by the offset indicated by the previous guess
			// Try recreating input time again
			// Then calculate and check the offset again
			const
				dateGuess2 = new Date(inDate.getTime() - dateOffsGuess),
				dateOffsGuess2 = getTimezoneOffset(tp.tz, dateGuess2);
			if ((dateOffsGuess2 - dateOffsGuess) === 0) {
				// All good, return local time
				return dateGuess2;
			} else if(!throwOnInvalid && (dateOffsGuess2 - dateOffsGuess) > 0) {
				// We're most probably dealing with a DST transition where we should use the offset of the second guess
				return dateGuess2; 
			} else if (!throwOnInvalid) {
				// We're most probably dealing with a DST transition where we should use the offset of the initial guess
				return dateGuess;
			} else {
				// Input time is invalid, and the library is instructed to throw, so let's do it
				throw new Error("Invalid date passed to fromTZ()");
			}
		}
	};
	
	
	minitz.toTZ = function (d, tzStr) {
	
		// - replace narrow no break space with regular space to compensate for bug in Node.js 19.1
		const localDateString = d.toLocaleString("en-US", {timeZone: tzStr}).replace(/[\u202f]/," ");
	
		const td = new Date(localDateString);
		return {
			y: td.getFullYear(),
			m: td.getMonth() + 1,
			d: td.getDate(),
			h: td.getHours(),
			i: td.getMinutes(),
			s: td.getSeconds(),
			tz: tzStr
		};
	};
	
	
	minitz.tp = (y,m,d,h,i,s,tz) => { return { y, m, d, h, i, s, tz: tz }; };
	
	
	function getTimezoneOffset(timeZone, date = new Date()) {
	
		// Get timezone 
		const tz = date.toLocaleString("en-US", {timeZone: timeZone, timeZoneName: "short"}).split(" ").slice(-1)[0];
	
		// Extract time in en-US format
		// - replace narrow no break space with regular space to compensate for bug in Node.js 19.1
		const dateString = date.toLocaleString("en-US").replace(/[\u202f]/," ");
	
		// Check ms offset between GMT and extracted timezone
		return Date.parse(`${dateString} GMT`) - Date.parse(`${dateString} ${tz}`);
	}
	
	
	
	function parseISOLocal(dtStr, tz) {
	
		// Parse date using built in Date.parse
		const pd = new Date(Date.parse(dtStr));
	
		// Check for completeness
		if (isNaN(pd)) {
			throw new Error("minitz: Invalid ISO8601 passed to parser.");
		}
		
		// If 
		//   * date/time is specified in UTC (Z-flag included)
		//   * or UTC offset is specified (+ or - included after character 9 (20200101 or 2020-01-0))
		// Return time in utc, else return local time and include timezone identifier
		const stringEnd = dtStr.substring(9);
		if (dtStr.includes("Z") || stringEnd.includes("-") || stringEnd.includes("+")) {
			return minitz.tp(pd.getUTCFullYear(), pd.getUTCMonth()+1, pd.getUTCDate(),pd.getUTCHours(), pd.getUTCMinutes(),pd.getUTCSeconds(), "Etc/UTC");
		} else {
			return minitz.tp(pd.getFullYear(), pd.getMonth()+1, pd.getDate(),pd.getHours(), pd.getMinutes(),pd.getSeconds(), tz);
		}
		// Treat date as local time, in target timezone
	
	}
	
	minitz.minitz = minitz;
	
	
	
	////////////////////////////////////
	
	// This import is only used by tsc for generating type definitions from js/jsdoc
	// deno-lint-ignore no-unused-vars
	
	
	
	const DaysOfMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
	
	
	const RecursionSteps = [
		["month", "year",  0],
		["day", "month", -1],
		["hour", "day",  0],
		["minute", "hour",  0],
		["second", "minute",  0],
	];
		
	
	function CronDate (d, tz) {	
	
	
		this.tz = tz;
	
		// Populate object using input date, or throw
		if (d && d instanceof Date) {
			if (!isNaN(d)) {
				this.fromDate(d);
			} else {
				throw new TypeError("CronDate: Invalid date passed to CronDate constructor");
			}
		} else if (d === void 0) {
			this.fromDate(new Date());
		} else if (d && typeof d === "string") {
			this.fromString(d);
		} else if (d instanceof CronDate) {
			this.fromCronDate(d);
		} else {
			throw new TypeError("CronDate: Invalid type (" + typeof d + ") passed to CronDate constructor");
		}
	
	}
	
	
	CronDate.prototype.fromDate = function (inDate) {
		
	
	 
	
		if (this.tz !== void 0) {
			if (typeof this.tz === "number") {
				this.ms = inDate.getUTCMilliseconds();
				this.second = inDate.getUTCSeconds();
				this.minute = inDate.getUTCMinutes()+this.tz;
				this.hour = inDate.getUTCHours();
				this.day = inDate.getUTCDate();
				this.month  = inDate.getUTCMonth();
				this.year = inDate.getUTCFullYear();
				// Minute could be out of bounds, apply
				this.apply();
			} else {
				const d = minitz.toTZ(inDate, this.tz);
				this.ms = inDate.getMilliseconds();
				this.second = d.s;
				this.minute = d.i;
				this.hour = d.h;
				this.day = d.d;
				this.month  = d.m - 1;
				this.year = d.y;
			}
		} else {
			this.ms = inDate.getMilliseconds();
			this.second = inDate.getSeconds();
			this.minute = inDate.getMinutes();
			this.hour = inDate.getHours();
			this.day = inDate.getDate();
			this.month  = inDate.getMonth();
			this.year = inDate.getFullYear();
		}
	
	};
	
	
	CronDate.prototype.fromCronDate = function (d) {
		this.tz = d.tz;
	
		this.year = d.year;
	
	
		this.month = d.month;
	
	
		this.day = d.day;
	
	
		this.hour = d.hour;
	
	
		this.minute = d.minute;
	
	
		this.second = d.second;
		
	
		this.ms = d.ms;
	
																																																	
	  
	  
	  
	   
	
	
	};
	
	
	CronDate.prototype.apply = function () {
		// If any value could be out of bounds, apply 
	
	
	
	
	
		if (this.month>11||this.day>DaysOfMonth[this.month]||this.hour>59||this.minute>59||this.second>59||this.hour<0||this.minute<0||this.second<0) {
			const d = new Date(Date.UTC(this.year, this.month, this.day, this.hour, this.minute, this.second, this.ms));
			this.ms = d.getUTCMilliseconds();
			this.second = d.getUTCSeconds();
			this.minute = d.getUTCMinutes();
			this.hour = d.getUTCHours();
			this.day = d.getUTCDate();
			this.month  = d.getUTCMonth();
			this.year = d.getUTCFullYear();
			return true;
		} else {
			return false;
		}
	
	 
	
	};
	
	
	CronDate.prototype.fromString = function (str) {
		return this.fromDate(minitz.fromTZISO(str, this.tz));
	};
	
	
	
	CronDate.prototype.findNext = function (options, target, pattern, offset) {
	  const originalTarget = this[target];
	
	  // In the conditions below, local time is not relevant. And as new Date(Date.UTC(y,m,d)) is way faster
	  // than new Date(y,m,d). We use the UTC functions to set/get date parts.
	
	  // Pre-calculate last day of month if needed
	  let lastDayOfMonth;
	  if (pattern.lastDayOfMonth || pattern.lastWeekdayOfMonth) {
		// This is an optimization for every month except February, which has a different number of days in different years
		if (this.month !== 1) {
		  lastDayOfMonth = DaysOfMonth[this.month];
		} else {
		  lastDayOfMonth = new Date(Date.UTC(this.year, this.month + 1, 0, 0, 0, 0, 0)).getUTCDate();
		}
	  }
	
	  // Pre-calculate weekday if needed
	  // Calculate offset weekday by ((fDomWeekDay + (targetDate - 1)) % 7)
	  const fDomWeekDay = (!pattern.starDOW && target === "day") ? new Date(Date.UTC(this.year, this.month, 1, 0, 0, 0, 0)).getUTCDay() : undefined;
	
	  for (let i = this[target] + offset; i < pattern[target].length; i++) {
		// this applies to all "levels"
		let match = pattern[target][i];
	
		// Special case for last day of month
		if (target === "day" && pattern.lastDayOfMonth && i - offset === lastDayOfMonth - 1) {
		  match = true;
		}
	
		// Special case for day of week
	
	
		if (target === "day" && !pattern.starDOW) {
		  let dowMatch = pattern.dayOfWeek[(fDomWeekDay + ((i - offset) - 1)) % 7];
	
		  // Extra check for l-flag
		  if (dowMatch && pattern.lastWeekdayOfMonth) {
			dowMatch = dowMatch && (i - offset + 1 > lastDayOfMonth - 7);
		  }
	
		  // If we use legacyMode, and dayOfMonth is specified - use "OR" to combine day of week with day of month
		  // In all other cases use "AND"
		  if (options.legacyMode && !pattern.starDOM) {      
			match = match || dowMatch;
		  } else {
			match = match && dowMatch;
		  }
	
		  
		  //console.log('date target='+target);
		  //console.log('date dowMatch='+dowMatch);
		  //console.log('date match='+match);
	
		}
	
		if (match) {
		  this[target] = i - offset;
	
		  //console.log('date if match='+(originalTarget !== this[target]) ? 2 : 1);
	
		  // Return 2 if changed, 1 if unchanged
		  return (originalTarget !== this[target]) ? 2 : 1;
	
		  
	
		}
	  }
	
	  // Return 3 if part was not matched
	  return 3;
	};
	
	CronDate.prototype.recurse = function (pattern, options, doing)  {
	
	
	
	// Find next month (or whichever part we're at)
	const res = this.findNext(options, RecursionSteps[doing][0], pattern, RecursionSteps[doing][2]);
	  
	//console.log('timesThroughRecursion: '+timesThroughRecursion);
	//console.log('maxRecordLevels: '+maxRecordLevels);
											  
	if (timesThroughRecursion < maxRecordLevels) {
	
	  
	
	 // console.log('timesThroughRecursion: '+timesThroughRecursion);
	 // console.log('maxRecordLevels: '+maxRecordLevels);
	
		// Month (or whichever part we're at) changed
		if (res > 1) {
	
		  
	
		  // Flag following levels for reset
		  let resetLevel = doing + 1;
		
		  while(resetLevel < RecursionSteps.length) {
			this[RecursionSteps[resetLevel][0]] = -RecursionSteps[resetLevel][2];
			resetLevel++;
			
		  }
		  // Parent changed
																								
								
		  if (res=== 3) {
	
								  
														
	
															  
	
			// Do increment parent, and reset current level
			this[RecursionSteps[doing][1]]++;
			this[RecursionSteps[doing][0]] = -RecursionSteps[doing][2];
			this.apply();
	
			
	
			// Restart
			return this.recurse(pattern, options, 0);
		  } else if (this.apply()) {
			
			return this.recurse(pattern, options, doing-1);
		  } else {
			//must have this section with 'return this' to avoid infinite loops and memory overruns
			return this;
		  }
	
		
		//return;
	
		}
	
		//return;
	  }
		// Move to next level
		doing += 1;
	  
	  
	
	//  console.log('Utilities-Sleep Count of doing var: '+doing);
	  
	
		// Done?
		if (doing >= RecursionSteps.length) {
	
		//console.log('done?: '+pattern);
	
		//Utilities.sleep(500);
	
			return this;
	
	
			// ... or out of bounds ?
		} else if (this.year >= 2050) {
	
		//console.log('out of bounds?: '+this);
	
			return null;
	
			// ... oh, go to next part then
		} else {
			
		//console.log('oh, go to next part then: '+this);
		
			return this.recurse(pattern, options, doing);
		}
		
	
	
	//return;
	
	};
	
	
	
	
	
	
	CronDate.prototype.increment = function (pattern, options, hasPreviousRun) {
		
		// Move to next second, or increment according to minimum interval indicated by option `interval: x`
		// Do not increment a full interval if this is the very first run
		this.second += (options.interval > 1 && hasPreviousRun) ? options.interval : 1;
	
		// Always reset milliseconds, so we are at the next second exactly
		this.ms = 0;
	
		// Make sure seconds has not gotten out of bounds
		this.apply();
	
		// Recursively change each part (y, m, d ...) until next match is found, return null on failure
		return this.recurse(pattern, options, 0);
		
	};
	
	
	
	
	function getNextDayOfWeek(field, year, month, day) {
	  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	  const cronDays = field.toLowerCase().split(',');
	  const currentDay = new Date(year, month - 1, day);
	 
	  for (let i = 0; i < 7; i++) {
		const nextDay = new Date(year, month - 1, day + i);
		const nextDayOfWeek = nextDay.getDay();
		const nextDayOfWeekStr = daysOfWeek[nextDayOfWeek].substring(0, 3);
	
		console.log('getNextDayOfWeek - nextDay: '+nextDay);
		console.log('getNextDayOfWeek - nextDayOfWeek: '+nextDayOfWeek);
		console.log('getNextDayOfWeek - nextDayOfWeekStr: '+nextDayOfWeekStr);
	
	   
		if (cronDays.includes(nextDayOfWeekStr) && nextDay > currentDay) {
		  return nextDay;
		}
	  }
	 
	  return null;
	}
	
	
	CronDate.prototype.getDate = function (internal) {
		// If this is an internal call, return the date as is
		// Also use this option when no timezone or utcOffset is set
		if (internal || this.tz === void 0) {
			return new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.ms);
		} else {
			// If .tz is a number, it indicates offset in minutes. UTC timestamp of the internal date objects will be off by the same number of minutes. 
			// Restore this, and return a date object with correct time set.
			if (typeof this.tz === "number") {
				return new Date(Date.UTC(this.year, this.month, this.day, this.hour, this.minute-this.tz, this.second, this.ms));
	
			// If .tz is something else (hopefully a string), it indicates the timezone of the "local time" of the internal date object
			// Use minitz to create a normal Date object, and return that.
			} else {
				return minitz(this.year, this.month+1, this.day, this.hour, this.minute, this.second, this.tz);
			}
		}
	};
	
	
	CronDate.prototype.getTime = function () {
		return this.getDate().getTime();
	};
	
	
	
	//////////////////////////////////
	
	
	function CronPattern(pattern) {
	
	
	
	  if (!(typeof pattern === "string" || pattern.constructor === String)) {
		throw new TypeError("CronPattern: Pattern has to be of type string.");
	  }
	
	  this.pattern = pattern.trim();
	  this.lastDayOfMonth = false;
	  this.lastWeekdayOfMonth = false;
	  this.starDOM = false;
	  this.starDOW = false;
	
	  this.second = new Array(60).fill(0);
	  this.minute = new Array(60).fill(0);
	  this.hour = new Array(24).fill(0);
	  this.day = new Array(31).fill(0);
	  this.month = new Array(12).fill(0);
	  this.dayOfWeek = new Array(7).fill(0);
	  this.year = [];
	
	  this.parse();
	}
	
	CronPattern.prototype.parse = function () {
	  if (this.pattern.indexOf("@") >= 0) {
	
	  
	
		this.pattern = this.handleNicknames(this.pattern);
	
		console.log('CronPattern-prototype-parse: found @: '+this.pattern);
	
	  }
	
	  const parts = this.pattern.replace(/\s+/g, " ").split(" ");
	
	  console.log('CronPattern-prototype-parse: parts length : '+parts.length);
	  console.log('CronPattern-prototype-parse: "second", parts[0]= '+parts[0]);
	  console.log('CronPattern-prototype-parse: "minute", parts[1]= '+parts[1]);
	  console.log('CronPattern-prototype-parse: "hour", parts[2]= '+parts[2]);
	  console.log('CronPattern-prototype-parse: "day", parts[3]= '+parts[3]);
	  console.log('CronPattern-prototype-parse: "month", parts[4]= '+parts[4]);
	  console.log('CronPattern-prototype-parse: "dayOfWeek", parts[5]= '+parts[5]);
	  console.log('CronPattern-prototype-parse: "year", parts[6]= '+parts[6]);
	
	
	
	  if (parts.length > 7) {
									 
		throw new TypeError(
		  "CronPattern: Invalid configuration format ('" +
			this.pattern +
			"'), exactly seven space-separated parts required."
		);
	  }
	
		if (parts.length <= 6) {
	
		console.log('CronPattern-prototype-parse: parts-length <=6 : true');
	
		parts[6] = '*';
	  }												
	
							
	  //replacing "#" in DayOfWeek for Quartz syntax to work with the minitz library as a /
	  if(parts[5].indexOf("#") >= 0 ){
	
		console.log('CronPattern-prototype-parse: parts5 has # : true');
	
		parts[5] = parts[5].replace("#", "/")
	
	  };	
					 
		
	  //replacing "?" in DayOfWeek for Quartz syntax to work with the minitz library
	  if(parts[5] === "?"){
	
		console.log('CronPattern-prototype-parse: parts5 has ? : true');
	
		parts[5] = parts[5].replace("?", "*")
	
	  };
	
	  //replacing "-" in DayOfWeek for Quartz syntax to work with minitz comma delimited list
	  if(parts[5].indexOf("SAT-SUN") >= 0 ){
	
		console.log('CronPattern-prototype-parse: parts5 has SAT-SUN : true');
	
		parts[5] = parts[5].replace("-", ",")
	
	  };
	
	  if (parts[3] === "*" && parts[5] === "*") {
		// Both dayOfMonth and dayOfWeek are set to *
		
		console.log('CronPattern-prototype-parse: parts3 and parts5 has * : true');
	
		this.starDOM = true;
		this.starDOW = true;
	  } else if (parts[3] === "*") {
		// Only dayOfMonth is set to *
	
		console.log('CronPattern-prototype-parse: ONLY parts3 has * : true');
	
		this.starDOM = true;
	  } else if (parts[5] === "*") {
		// Only dayOfWeek is set to *
	
		console.log('CronPattern-prototype-parse: ONLY parts5 has * : true');
	
		this.starDOW = true;
	  }
	
	  if (parts[4].length >= 3) {
	
		console.log('CronPattern-prototype-parse: parts4 length >=3 replaceAlphaDays : true');
	
		parts[4] = this.replaceAlphaMonths(parts[4]);
	  }
	
	  if (parts[5].length >= 3) {
	
		console.log('CronPattern-prototype-parse: parts5 length >=3 replaceAlphaDays : true');
	
		parts[5] = this.replaceAlphaDays(parts[5]);
	  }
	
	  if (this.pattern.indexOf("?") >= 0) {
	
		console.log('CronPattern-prototype-parse: index of ? >= : true');
	
		const initDate = new CronDate(new Date(), this.timezone).getDate(true);
		parts[0] = parts[0].replace("?", initDate.getSeconds());
		parts[1] = parts[1].replace("?", initDate.getMinutes());
		parts[2] = parts[2].replace("?", initDate.getHours());
		if (!this.starDOM) parts[3] = parts[3].replace("?", initDate.getDate());
		parts[4] = parts[4].replace("?", initDate.getMonth() + 1);
		if (!this.starDOW) parts[5] = parts[5].replace("?", initDate.getDay());
		
	  }
	
	  this.throwAtIllegalCharacters(parts);
	
	  this.partToArray("second", parts[0], 0);
	  this.partToArray("minute", parts[1], 0);
	  this.partToArray("hour", parts[2], 0);
	  this.partToArray("day", parts[3], -1);
	  this.partToArray("month", parts[4], -1);
	  this.partToArray("dayOfWeek", parts[5], 0);
	  this.partToArray("year", parts[6], 0);
	
	  if (this.dayOfWeek[7]) {
	
		console.log('CronPattern-prototype-parse: this-dayOfWeek[7] : true');
	
		this.dayOfWeek[0] = 1;
	  }
	};
	
	
	CronPattern.prototype.partToArray = function (type, conf, valueIndexOffset) {
	  const arr = this[type];
	
	  if (conf === "*") {
	
		console.log('CronPattern-prototype-partToArray: conf === * : true : fill(1)');
	
		arr.fill(1);
		return;
	  }
	
	  if (conf === "?") {
	
		console.log('CronPattern-prototype-partToArray: conf === ? : true : fill(1)');
	
		arr.fill(1);
		return;
	  }
	
	  const split = conf.split(",");
	  if (split.length > 1) {
	
		console.log('CronPattern-prototype-partToArray: conf split > 1 : true');
	
		for (let i = 0; i < split.length; i++) {
		  this.partToArray(type, split[i], valueIndexOffset);
		}
	  } else if (conf.indexOf("-") !== -1 && conf.indexOf("/") !== -1) {
	
		console.log('CronPattern-prototype-partToArray: conf.indexOf("-") !== -1 && conf.indexOf("/") !== -1 : true');
	
		this.handleRangeWithStepping(conf, type, valueIndexOffset);
	  } else if (conf.indexOf("-") !== -1) {
	
		console.log('CronPattern-prototype-partToArray: conf.indexOf("-") !== -1 : true');
	
		this.handleRange(conf, type, valueIndexOffset);
	  } else if (conf.indexOf("/") !== -1) {
	
		console.log('CronPattern-prototype-partToArray: conf.indexOf("/") !== -1 : true');
	
		this.handleStepping(conf, type, valueIndexOffset);
	  } else if (conf !== "") {
	
			console.log('CronPattern-prototype-partToArray: conf !== "" : true');																									 
			 
		this.handleNumber(conf, type, valueIndexOffset);
	  }
	};
	
	CronPattern.prototype.throwAtIllegalCharacters = function (parts) {
		const reValidCron = /[^0-9*\/,\-\?^A-Z]+/;
														
		for(let i = 0; i < parts.length; i++) {
			if( reValidCron.test(parts[i]) ) {
				throw new TypeError("CronPattern: configuration entry " + i + " (" + parts[i] + ") contains illegal characters.");
			}
		}
	};
	
	
	CronPattern.prototype.handleNumber = function (conf, type, valueIndexOffset) {
	  const i = parseInt(conf, 10) + valueIndexOffset;
	
	  console.log('CronPattern-prototype-handleNumber: type='+type);
	  console.log('CronPattern-prototype-handleNumber: i constant='+i);
	
	  if (isNaN(i)) {
		throw new TypeError("CronPattern: " + type + " is not a number: '" + conf + "'");
	  }
	
	  let maxRange;
	  if (type === "dayOfWeek") {
	
		console.log('CronPattern-prototype-handleNumber: type === "dayOfWeek": true');
	
		maxRange = 7; // Day of week range: 0-6 (Sunday-Saturday)
		} else if (type === "year") {
	
		console.log('CronPattern-prototype-handleNumber: type === "year": true');
	
		maxRange = 2050; // year range to 3000						   
											  
	  } else {
	
		console.log('CronPattern-prototype-handleNumber: type not dayOfWeek not Year: true : maxRange ='+this[type].length);
	
		maxRange = this[type].length;
	  }
	
	  if (i < 0 || i > maxRange) {
		throw new TypeError("CronPattern: " + type + " value out of range: '" + conf + "'");
	  }
	
	  this[type][i] = 1;
	};
	
	
	
	CronPattern.prototype.handleRangeWithStepping = function (conf, type, valueIndexOffset) {
	  const matches = conf.match(/^(\d+)-(\d+)\/(\d+)$/);
	
	  if (matches === null) {
		throw new TypeError("CronPattern: Syntax error, illegal range with stepping: '" + conf + "'");
	  }
	
	  let [, lower, upper, steps] = matches;
	  lower = parseInt(lower, 10) + valueIndexOffset;
	  upper = parseInt(upper, 10) + valueIndexOffset;
	  steps = parseInt(steps, 10);
	
	  console.log('CronPattern-prototype-handleRangeWithStepping: lower = '+lower+' upper= '+upper+' steps='+steps);
	
	  if (isNaN(lower)) {
		throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");
	  }
	
	  if (isNaN(upper)) {
		throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");
	  }
	
	  if (isNaN(steps)) {
		throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");
	  }
	
	  if (steps === 0) {
		throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");
	  }
	
	  if (steps > this[type].length) {
		throw new TypeError(
		  "CronPattern: Syntax error, steps cannot be greater than maximum value of part (" +
			this[type].length +
			")"
		);
	  }
	  
	  if ( upper == 6 && lower == -7 ) {
	
		 console.log('CronPattern-prototype-handleRangeWithStepping: upper == 6 && lower == -7: true');
	
		upper = 7;
		lower = 6;
		
	
		  for (let i = lower; i <= upper; i++) {
		  this[type][i] = 1;
		}
	
	  }
	  
	  if ((lower < 0 & upper != -7) || upper >= this[type].length) {
		//throw new TypeError("CronPattern: Value out of range: '" + conf + "'");
	
		console.log('CronPattern-prototype-handleRangeWithStepping: (lower < 0 & upper != -7) || upper >= this[type].length : true');
	
		for (let i = lower; i >= upper; i--) {
			  this[type][i] = 1;
			}
	
	
	  }
	
	  if (lower > upper) {
		//throw new TypeError("CronPattern: From value is larger than to value: '" + conf + "'");
		
		console.log('CronPattern-prototype-handleRangeWithStepping: lower > upper : true');
	
		for (let i = lower; i >= upper; i--) {
		  this[type][i] = 1;
		}
		
	
	  }
	
	  for (let i = lower; i <= upper; i += steps) {
		this[type][i] = 1;
	  }
	};
	
	
	CronPattern.prototype.handleRange = function (conf, type, valueIndexOffset) {
	  const split = conf.split("-");
	
	  console.log('CronPattern-prototype-handleRange: const split of - ='+split);
	
	  if (split.length !== 2) {
		throw new TypeError("CronPattern: Syntax error, illegal range: '" + conf + "'");
	  }
	
	  const lower = parseInt(split[0], 10) + valueIndexOffset;
	  const upper = parseInt(split[1], 10) + valueIndexOffset;
	
	  if (isNaN(lower)) {
		throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");
	  } else if (isNaN(upper)) {
		throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");
	  }
	
	  if (lower == -7 && upper == 6){
	
		console.log('CronPattern-prototype-handleRange: lower == -7 && upper == 6 : true');
	
		lower = 6;
		upper = 7;
	
		  for (let i = lower; i <= upper; i++) {
		  this[type][i] = 1;
		}
	
	  }
	
	  if ( (lower < 0 && upper != -7) || upper >= this[type].length) {
		//throw new TypeError("CronPattern: Value out of range: '" + conf + "'");
	
		console.log('CronPattern-prototype-handleRange: (lower < 0 && upper != -7) || upper >= this[type].length : true');
	
		for (let i = lower; i >= upper; i--) {
		  this[type][i] = 1;
		}
	
	  }
	
	  if (lower > upper) {
		//throw new TypeError("CronPattern: From value is larger than to value: '" + conf + "'");
		
		console.log('CronPattern-prototype-handleRange: lower > upper : true');
		
		for (let i = lower; i >= upper; i--) {
		  this[type][i] = 1;
		}
	
	
	
	  }
	
	  for (let i = lower; i <= upper; i++) {
		this[type][i] = 1;
	  }
	};
	
	
	
	CronPattern.prototype.handleStepping = function (conf, type, valueIndexOffset) {
	  const split = conf.split("/");
	
	  console.log('CronPattern-prototype-handleStepping: const split of / ='+split);
	
	  if (split.length !== 2) {
		throw new TypeError("CronPattern: Syntax error, illegal stepping: '" + conf + "'");
	  }
	
	  let start = 0;
	  if (split[0] !== "*") {
	
		console.log('CronPattern-prototype-handleStepping: split[0] !== "*" : true ');
	
		start = parseInt(split[0], 10);
	  }
	
	  if (split[0] !== "?") {
	
		console.log('CronPattern-prototype-handleStepping: split[0] !== "?" : true ');
	
		start = parseInt(split[0], 10);
	  }
	
	  const steps = parseInt(split[1], 10);
	
	  if (isNaN(steps)) {
		throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");
	  }
	  if (steps === 0) {
		throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");
	  }
	  if (steps > this[type].length) {
		throw new TypeError(
		  "CronPattern: Syntax error, max steps for part is (" + this[type].length + ")"
		);
	  }
	
	  for (let i = start; i < this[type].length; i += steps) {
	
																										   
	
		this[type][i] = 1;
	  }
	};
	 
	
	
	CronPattern.prototype.replaceAlphaDays = function (conf) {
	
	  console.log('CronPattern-prototype-replaceAlphaDays: conf ='+conf);
	
	  if(conf = 'SAT-SUN'){
	
		console.log('CronPattern-prototype-replaceAlphaDays: conf = SAT-SUN : true');
	
		conf = conf.replace(/-SUN/gi, ",7");
		conf = conf.replace(/SAT/gi, "6");
		conf = conf.replace(/-sun/gi, ",7");
		conf = conf.replace(/sat/gi, "6");
	
		console.log('CronPattern-prototype-replaceAlphaDays: conf after replacements = '+conf);
	
		return conf;
	
	  };
	
	  if(1 == 1 ) {
	
	  console.log('CronPattern-prototype-replaceAlphaDays: conf = SAT-SUN : true');
	
		
			conf = conf.replace(/-sun/gi, "-7") // choose 7 if sunday is the upper value of a range because the upper value must not be smaller than the lower value
		//.replace(/-sun/gi, "7") // choose 7 if sunday is the upper value of a range because the upper value must not be smaller than the lower value
			conf = conf.replace(/sun/gi, "0")
			conf = conf.replace(/mon/gi, "1")
			conf = conf.replace(/tue/gi, "2")
			conf = conf.replace(/wed/gi, "3")
			conf = conf.replace(/thu/gi, "4")
			conf = conf.replace(/fri/gi, "5")
			conf = conf.replace(/sat/gi, "6")
		conf = conf.replace(/-SUN/gi, "-7") // choose 7 if sunday is the upper value of a range because the upper value must not be smaller than the lower value
		//.replace(/-SUN/gi, "7") // choose 7 if sunday is the upper value of a range because the upper value must not be smaller than the lower value
			conf = conf.replace(/SUN/gi, "0")
			conf = conf.replace(/MON/gi, "1")
			conf = conf.replace(/TUE/gi, "2")
			conf = conf.replace(/WED/gi, "3")
			conf = conf.replace(/THU/gi, "4")
			conf = conf.replace(/FRI/gi, "5")
			conf = conf.replace(/SAT/gi, "6");
	
		console.log('CronPattern-prototype-replaceAlphaDays: conf after replacements = '+conf);
	
		return conf;
	
		
	  }
	
	};
	
	
	CronPattern.prototype.replaceAlphaMonths = function (conf) {
	
	  console.log('CronPattern-prototype-replaceAlphaMonths: conf ='+conf);
	
		return conf
			.replace(/jan/gi, "1")
			.replace(/feb/gi, "2")
			.replace(/mar/gi, "3")
			.replace(/apr/gi, "4")
			.replace(/may/gi, "5")
			.replace(/jun/gi, "6")
			.replace(/jul/gi, "7")
			.replace(/aug/gi, "8")
			.replace(/sep/gi, "9")
			.replace(/oct/gi, "10")
			.replace(/nov/gi, "11")
			.replace(/dec/gi, "12");
	};
	
	
	CronPattern.prototype.handleNicknames = function (pattern) {
		// Replace textual representations of pattern
		const cleanPattern = pattern.trim().toLowerCase();
	
	  console.log('CronPattern-prototype-handleNicknames: cleanPattern ='+cleanPattern);
	
		if (cleanPattern === "@yearly" || cleanPattern === "@annually") {
			return "0 0 1 1 *";
		} else if (cleanPattern === "@monthly") {
			return  "0 0 1 * *";
		} else if (cleanPattern === "@weekly") {
			return "0 0 * * 0";
		} else if (cleanPattern === "@daily") {
			return "0 0 * * *";
		} else if (cleanPattern === "@hourly") {
			return "0 * * * *";
		} else {
			return pattern;
		}
	};
	
	
	
	
	/////////////////////////////////
	
	
	
	
	// This import is only used by tsc for generating type definitions from js/jsdoc
	// deno-lint-ignore no-unused-vars
	
	
	
	
	
	function CronOptions(options) {
		
	  
	
	
		// If no options are passed, create empty object
		if (options === void 0) {
			options = {};
		//console.log('Cron.prototype._trigger.currentRun: '+Cron.prototype._trigger.currentRun);
		//options.startAt = Cron.prototype._trigger.currentRun.toLocaleDateString();
		}
		
		// Don't duplicate the 'name' property
		delete options.name;
	
		// Keep options, or set defaults
		options.legacyMode = (options.legacyMode === void 0) ? true : options.legacyMode;
		options.paused = (options.paused === void 0) ? false : options.paused;
		options.maxRuns = (options.maxRuns === void 0) ? Infinity : options.maxRuns;
		options.catch = (options.catch === void 0) ? false : options.catch;
		options.interval = (options.interval === void 0) ? 0 : parseInt(options.interval, 10);
		options.utcOffset = (options.utcOffset === void 0) ? void 0 : parseInt(options.utcOffset, 10);
		options.unref = (options.unref === void 0) ? false : options.unref;
		
		// startAt is set, validate it
		if( options.startAt ) {
			options.startAt = new CronDate(options.startAt, options.timezone);
		} 
		if( options.stopAt ) {
			options.stopAt = new CronDate(options.stopAt, options.timezone);
		}
	
		// Validate interval
		if (options.interval !== null) {
			if (isNaN(options.interval)) {
				throw new Error("CronOptions: Supplied value for interval is not a number");
			} else if (options.interval < 0) {
				throw new Error("CronOptions: Supplied value for interval can not be negative");
			}
		}
	
		// Validate utcOffset
		if (options.utcOffset !== void 0) {
			
			// Limit range for utcOffset
			if (isNaN(options.utcOffset)) {
				throw new Error("CronOptions: Invalid value passed for utcOffset, should be number representing minutes offset from UTC.");
			} else if (options.utcOffset < -870 || options.utcOffset > 870 ) {
				throw new Error("CronOptions: utcOffset out of bounds.");
			}
			
			// Do not allow both timezone and utcOffset
			if (options.utcOffset !== void 0 && options.timezone) {
				throw new Error("CronOptions: Combining 'utcOffset' with 'timezone' is not allowed.");
			}
	
		}
	
		// Unref should be true, false or undefined
		if (options.unref !== true && options.unref !== false) {
			throw new Error("CronOptions: Unref should be either true, false or undefined(false).");
		}
	
	  
		
		return options;
	
	}
	
	
	/////////////////////////////////
	
	
	
	
	
	/////////////////////////////////
	
	
	function isFunction(v) {
		return (
			Object.prototype.toString.call(v) === "[object Function]" ||
			"function" === typeof v ||
			v instanceof Function
		);
	}
	
	
	function unrefTimer(timer) {
		/* global Deno */
		if (typeof Deno !== "undefined" && typeof Deno.unrefTimer !== "undefined") {
			Deno.unrefTimer(timer);
			// Node
		} else if (timer && typeof timer.unref !== "undefined") {
			timer.unref();
		}
	}
	
	//export { isFunction, unrefTimer };
	
	////////////////////////////////
	
	
	const maxDelay = Math.pow(2, 32 - 1) - 1;
	
	
	const scheduledJobs = [];
	
	
	function Cron(pattern, fnOrOptions1, fnOrOptions2) {
		// Optional "new" keyword
		if (!(this instanceof Cron)) {
			return new Cron(pattern, fnOrOptions1, fnOrOptions2);
		}
	
		// Make options and func optional and interchangable
		let options, func;
	
		if (isFunction(fnOrOptions1)) {
			func = fnOrOptions1;
		} else if (typeof fnOrOptions1 === "object") {
			options = fnOrOptions1;
		} else if (fnOrOptions1 !== void 0) {
			throw new Error(
				"Cron: Invalid argument passed for optionsIn. Should be one of function, or object (options).",
			);
		}
	
		if (isFunction(fnOrOptions2)) {
			func = fnOrOptions2;
		} else if (typeof fnOrOptions2 === "object") {
			options = fnOrOptions2;
		} else if (fnOrOptions2 !== void 0) {
			throw new Error(
				"Cron: Invalid argument passed for funcIn. Should be one of function, or object (options).",
			);
		}
	
	
		this.name = options ? options.name : void 0;
	
	  console.log('Cron options ='+options);
	
		this.options = CronOptions(options);
	
	
		this._states = {
	
			kill: false,
	
	
			blocking: false,
	
	
			previousRun: void 0,
	
	
			currentRun: void 0,
	
	
			once: void 0,
	
	
			currentTimeout: void 0,
	
			maxRuns: options ? options.maxRuns : void 0,
	
	
			paused: options ? options.paused : false,
			
	
			pattern: void 0,
		};
	
	  console.log('cron _states.currentrun:'+this._states.currentRun);
	
	
		// Check if we got a date, or a pattern supplied as first argument
		// Then set either this._states.once or this._states.pattern
		if (
			pattern &&
			(pattern instanceof Date || ((typeof pattern === "string") && pattern.indexOf(":") > 0))
		) {
			this._states.once = new CronDate(pattern, this.options.timezone || this.options.utcOffset);
		} else {
			this._states.pattern = new CronPattern(pattern, this.options.timezone);
		}
	
		// Only store the job in scheduledJobs if a name is specified in the options.
		if (this.name) {
			const existing = scheduledJobs.find((j) => j.name === this.name);
			if (existing) {
				throw new Error(
					"Cron: Tried to initialize new named job '" + this.name + "', but name already taken.",
				);
			} else {
				scheduledJobs.push(this);
			}
		}
	
		// Allow shorthand scheduling
		if (func !== void 0) {
			this.fn = func;
			this.schedule();
		}
	
		return this;
	}
	
	
	
	
	
	Cron.prototype.nextRun = function (prev, startDate) {
	  const now = startDate || new Date();
	  const next = this._next(prev);
	  if (next && next.getTime() < now.getTime()) {
		return this._next(next, now);
	  }
	  return next ? next.getDate() : null;;
	};
	
	
	Cron.prototype.nextRuns = function (n, previous) {
		if (n > this._states.maxRuns) {
		//timesThroughRecursion += 1;
			n = this._states.maxRuns;
		}
		const enumeration = [];
		let prev = previous || this._states.currentRun;
		while (n-- && (prev = this.nextRun(prev))) {
		
			enumeration.push(prev);
		}
	
				
	  //
		return enumeration;
	};
	
	
	Cron.prototype.getPattern = function () {
		return this._states.pattern ? this._states.pattern.pattern : void 0;
	};
	
	
	Cron.prototype.isRunning = function () {
		const msLeft = this.msToNext(this._states.currentRun);
	
		const isRunning = !this._states.paused;
		const isScheduled = this.fn !== void 0; 
		// msLeft will be null if _states.kill is set to true, so we don't need to check this one, but we do anyway...
		const notIsKilled = !this._states.kill;
	
		return isRunning && isScheduled && notIsKilled && msLeft !== null;
	};
	
	
	Cron.prototype.isStopped = function () {
		return this._states.kill;
	};
	
	
	Cron.prototype.isBusy = function () {
		return this._states.blocking;
	};
	
	
	Cron.prototype.currentRun = function () {
		return this._states.currentRun ? this._states.currentRun.getDate() : null;
	};
	
	
	Cron.prototype.previousRun = function () {
		return this._states.previousRun ? this._states.previousRun.getDate() : null;
	};
	
	
	Cron.prototype.msToNext = function (prev) {
		// Get next run time
		const next = this._next(prev);
	
		// Default previous for millisecond calculation
		prev = new CronDate(prev, this.options.timezone || this.options.utcOffset);
	
		if (next) {
			return (next.getTime(true) - prev.getTime(true));
		} else {
			return null;
		}
	};
	
	
	Cron.prototype.stop = function () {
	
		// If there is a job in progress, it will finish gracefully ...
	
		// Flag as killed
		this._states.kill = true;
	
		// Stop any waiting timer
		if (this._states.currentTimeout) {
			clearTimeout(this._states.currentTimeout);
		}
	
		// Remove job from the scheduledJobs array to free up the name, and allow the job to be
		// garbage collected
		const jobIndex = scheduledJobs.indexOf(this);
		if (jobIndex >= 0) {
			scheduledJobs.splice(jobIndex, 1);
		}
	};
	
	
	
	
	Cron.prototype.pause = function () {
		
		this._states.paused = true;
	
		return !this._states.kill;
	};
	
	
	Cron.prototype.resume = function () {
	
		this._states.paused = false;
	
		return !this._states.kill;
	};
	
	
	Cron.prototype.schedule = function (func, partial) {
		// If a function is already scheduled, bail out
		if (func && this.fn) {
			throw new Error(
				"Cron: It is not allowed to schedule two functions using the same Croner instance.",
			);
	
			// Update function if passed
		} else if (func) {
			this.fn = func;
		}
	
		// Get ms to next run, bail out early if any of them is null (no next run)
		let waitMs = this.msToNext(partial ? partial : this._states.currentRun);
		const target = this.nextRun(partial ? partial : this._states.currentRun);
		if (waitMs === null || target === null) return this;
	
		// setTimeout cant handle more than Math.pow(2, 32 - 1) - 1 ms
		if (waitMs > maxDelay) {
			waitMs = maxDelay;
		}
	
		// Start the timer loop
		// _checkTrigger will either call _trigger (if it's time, croner isn't paused and whatever), 
		// or recurse back to this function to wait for next trigger
		this._states.currentTimeout = setTimeout(() => this._checkTrigger(target), waitMs);
	
		// If unref option is set - unref the current timeout, which allows the process to exit even if there is a pending schedule
		if (this._states.currentTimeout && this.options.unref) {
			unrefTimer(this._states.currentTimeout);
		}
	
		return this;
	};
	
	
	Cron.prototype._trigger = async function (initiationDate) {
	
		this._states.blocking = true;
	
		this._states.currentRun = new CronDate(
			void 0, // We should use initiationDate, but that does not play well with fake timers in third party tests. In real world there is not much difference though */
			this.options.timezone || this.options.utcOffset,
		);
	
		if (this.options.catch) {
			try {
				await this.fn(this, this.options.context);
			} catch (_e) {
				if (isFunction(this.options.catch)) {
					this.options.catch(_e, this);
				}
			}
		} else {
			// Trigger the function without catching
			await this.fn(this, this.options.context);
	
		}
	
		this._states.previousRun = new CronDate(
			initiationDate,
			this.options.timezone || this.options.utcOffset,
		);
	
		this._states.blocking = false;
	
	};
	
	
	Cron.prototype.trigger = async function () {
		await this._trigger();
	};
	
	
	Cron.prototype._checkTrigger = function (target) {
		const now = new Date(),
			shouldRun = !this._states.paused && now.getTime() >= target,
			isBlocked = this._states.blocking && this.options.protect;
	
		if (shouldRun && !isBlocked) {
			this._states.maxRuns--;
	
			// We do not await this
			this._trigger();
	
		} else {
			// If this trigger were blocked, and protect is a function, trigger protect (without awaiting it, even if it's an synchronous function)
			if (shouldRun && isBlocked && isFunction(this.options.protect)) {
				setTimeout(() => this.options.protect(this), 0);
			}
		}
	
		// Always reschedule
		this.schedule(undefined, now);
	};
	
	
	Cron.prototype._next = function (prev) {
		const hasPreviousRun = (prev || this._states.currentRun) ? true : false;
	
		// Ensure previous run is a CronDate
	
	  //console.log('prototype._next: prev= '+prev);
	  //console.log('prototype._next: this._states.currentRun= '+this._states.currentRun);
	
		prev = new CronDate(prev, this.options.timezone || this.options.utcOffset);
	
	  //prev = new CronDate(prev, this.options.startAt || this.options.utcOffset);
	
	  console.log('this.options.startAt='+this.options.startAt);
	  console.log('this.options.timezone='+this.options.timezone);
	  console.log('this.options.utcOffset='+this.options.utcOffset);
	
		// Previous run should never be before startAt
		if (this.options.startAt && prev && prev.getTime() < this.options.startAt.getTime()) {
			prev = this.options.startAt;
		}
	
	
	
		// Calculate next run according to pattern or one-off timestamp, pass actual previous run to increment
		const nextRun = this._states.once ||
			new CronDate(prev, this.options.timezone || this.options.utcOffset).increment(
				this._states.pattern,
				this.options,
				hasPreviousRun, // hasPreviousRun is used to allow 
	
			);
	
	//console.log(nextRun);
	
	
		if (this._states.once && this._states.once.getTime() <= prev.getTime()) {
			return null;
		} else if (
			(nextRun === null) ||
			(this._states.maxRuns <= 0) ||
			(this._states.kill) ||
			(this.options.stopAt && nextRun.getTime() >= this.options.stopAt.getTime())
		) {
			return null;
		} else {
			// All seem good, return next run
		   
			return nextRun;
	
		  
		}
	};
	
	
	
	
	
	
	
	
	
	Cron.Cron = Cron;
	Cron.scheduledJobs = scheduledJobs;
	
	
	
			 
	
	return Cron
	
	});
	
	
	
	
	
	
	}
	
	