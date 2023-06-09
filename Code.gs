function myFunction() {

  //quartzCroner();

  //var job = Cron('0 0 7-19/4 ? * 6,7 *').nextRuns(25);

/*

Quartz Cron Parts
Seconds	Minutes	Hours	DayOfMonth Month	DayOfWeek	Year
? - Any
* - Every
x/y - iteration x=start(range) y=number of times repeated


0 0/1 * 1/1 * ? *	Every minute -- PASSED
0 0 07-19 ? * MON-FRI *	Between 07:00 AM and 07:59 PM, Monday through Friday -- PASSED
0 0 07-19/4 ? * SAT-SUN *	Every 4 hours, between 07:00 AM and 07:59 PM, Saturday through Sunday -- PASSED
0 0 14,15 ? * * *	At 02:00 PM and 03:00 PM -- PASSED
0 0 0/2 1/1 * ? *	Every 2 hours -- PASSED
0 0 9 1/1 * ? *	At 09:00 AM -- PASSED
0 0 0/12 1/1 * ? *	Every 12 hours -- PASSED
0 0 06 ? * FRI *	At 06:00 AM, only on Friday -- PASSED
0 0 0/4 1/1 * ? *	Every 4 hours -- PASSED
0 50 7 ? * MON,WED,FRI *	At 07:50 AM, only on Monday, Wednesday, and Friday -- PASSED
0 00 19 ? * MON,TUE,WED,THU,FRI,SAT *	At 07:00 PM, only on Monday, Tuesday, Wednesday, Thursday, Friday, and Saturday -- PASSED
0 30 2 28 1/1 ? *	At 02:30 AM, on day 28 of the month -- FAILED
0 0 22 29,30 DEC ? *	At 10:00 PM, on day 29 and 30 of the month, only in December -- FAILED

 */
  cronerFunctionsLG();

  var job = Cron('0 00 19 ? * MON,TUE,WED,THU,FRI,SAT *').nextRuns(25);

  console.log(job);


 
}
