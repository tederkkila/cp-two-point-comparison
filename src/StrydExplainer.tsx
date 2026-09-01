import { Analytics } from "@vercel/analytics/react";

function StrydInstructions() {

  return (

    <main className="flex flex-col p-1">

      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">How to Use Stryd AutoCP Model Viewer</h1>
      </div>

      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">

        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <p>Back to <a href="/StrydAutoCP"
                        className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline">
            Stryd AutoCP Model
            <svg className="w-4 h-4 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </a></p>

        </div>

        {/*graphs*/}
        <div className="flex gap-2 flex-col grow rounded-lg bg-gray-50 px-2 py-2">
          <h3 className="text-l font-bold">How is the Stryd AutoCP calculated?</h3>
          <p>It is generally believed that the Stryd AutoCP model is an adaptation of the Golden Cheetah interpretation of the Extended CP model<br/>
            Source is here: <a href={"https://github.com/GoldenCheetah/GoldenCheetah/blob/master/src/Metrics/ExtendedCriticalPower.cpp"}>GoldenCheetah @github</a></p>
          <p>Basically this model breaks the Max Power curve into 3 segments: Alactic (C1), Anaerobic (C2), and Aerobic (C3).  It then uses an algorithm to determine the various variables that model the three curves.
            This approach is designed (like many other methods) to better fit a human power curve in that both the max power does not go to infinity and the output gradually decreases over time. This is something the Linear CP models do not do.</p>
          <p>As the model has a lot of variables, GC (and I would infer Stryd) hold several of these variables constant.<br/>
          GC then establishes some starting values for the parameters and cycles through loop in which the parameters are fine tuned with each iteration.</p>

          <h3 className="text-l font-bold mt-3">What does this tool do?</h3>
          <p>This app has three basic purposes:</p>
          <ul className="list-disc list-inside dark:text-gray-400">
            <li><span className="font-bold">What Stryd Thinks your Extended CP model looks like</span> It takes the extended model curves which are on - but not yet displayed - the Stryd website and displays them and uses multivariable regression to try to determine what Stryd thinks your Extended model variables are</li>
            <li><span className="font-bold">What this app Thinks your Extended CP model looks like</span> It takes the max power data from the Stryd website and tries to "recreate" AutoCP values using an interpretation of the Stryd "Special Sauce" / GC algorithm</li>
            <li><span className="font-bold">"What if" scenarios</span> It allows you to adjust (at this point only increase) the max power data at different time points for various "what if" scenarios</li>
          </ul>

          <h3 className="text-l font-bold mt-3">What Stryd thinks your Extended CP model looks like</h3>
          <p>This is the data used to create the Stryd Power Duration Curve.
          As noted in the instructions this is the "pdc?include_breakdown=1" file.
          </p>
          <pre><code>
            {
`{
  "curve": {
    "power_list": ["list of max powers every second of available data range"],
    "timestamp_list": ["timestamps of workout related to each max power "],
    "id_list": ["ids of workouts related to each max power"],
    "title_list": ["Titles of workouts"]
},
  "breakdown": {
    "alactic": ["solved Extended model alactic curve each second"],
    "anaerobic": ["solved Extended model anaerobic curve each second"],
    "aerobic": ["solved Extended model aerobic curve each second"],
    "total": ["alactic + anaerobic + aerobic + "fudge factor" so power at 1s is still max power"]
  }
}`}
          </code></pre>
          <p>You can see that the data is broken down into two parts. The "Curve" part is what is actually shown in your PDC. The "Breakdown" part is the data for the Extended CP model.</p>
          <p>The "Curve" part will show you the power at each second of the workout, while the "Breakdown" part will show you the alactic, anaerobic, and aerobic power at each second of the workout.</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/stryd_solution.png"} alt={"Screenshot of Stryd Solution"}/>
          <p>This is the other data is that is shown on this chart</p>
          <ul>
            <li><span className="font-bold">Curves:</span> the alactic, anaerobic, and aerobic power at each second of the workout</li>
            <li><span className="font-bold">Total power:</span> the total power at each second of the workout. It can be more than sum of sub-curves to ensure power at 1s is also max power</li>
            <li><span className="font-bold">iterations:</span> how many iterations were used to estimate the Stryd Extended CP model parameters.</li>
            <li><span className="font-bold">CP "valid" region:</span> the time range used to sample points to do a comparison linear CP estimate using "X" points (not everyone has 22 min runs). Opinions vary on what these should be. I include 22 as a max because Stryders have this data - not because the literature says it should be valid.</li>
            <li><span className="font-bold">Extended CP model parameters:</span> estimated parameters (and derived W')</li>
            <li><span className="font-bold">2-point CP:</span> Really the X-Point linear CP. Here 5 points are used</li>
            <li><span className="font-bold">RMSE:</span> Root Mean Square Error derived from plotted points on curves compared to estimates</li>
          </ul>

          <p>In most cases the fit here of the individual curves should be quite good with RMSE values less than 1.
           However, there are cases where the GC algorithm can get stuck on paadec values of -3 and tau of 0.5. When this happens I color these curves red to indicate that the model may not be valid.</p>
          <p>For example, the following curve has excellent fit (RMSE are all very low). However, tau is close to 0.5 and shaded red to flag it.</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/bad_tau.png"} alt={"Screenshot of Bad Stryd Solution"}/>


          <h3 className="text-l font-bold mt-3">What this app thinks your Extended CP model looks like</h3>
          <p>Let's start with a simple example. Here is the full result from analyzing my PDC when I had good data</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/good_example.png"} alt={"Screenshot of good GC estimation"}/>
          <p>Looking at the Stryd Solution we can see that the fit is excellent with no flagged values (although paadec is nearing -3).</p>
          <p>If we compare the parameters of the Stryd Solution and Extended estimate from Stryd data there are actually very close. The graph shows this by shading estimate above Stryd with green and below Stryd with red. There is very little visible shading.</p>

          <p>But what is really going on under the hood?<br/>
          Note the shaded time boxes (1-8s, 20-90s, etc.) There are the areas that are used to estimate each parameter (the related parameters is noted with the time). These are derived from the original GC code, but also testing on the Stryd website. An example of a test would be to generate a fake 8 min 350W .fit file and see if it effected the Stryd calculations.
          There should be a green dot in each time box showing the actual time and max power used to finally estimate that parameter. If the value is missing then it means the the algorithm did not find a value in that time box in that iteration that met the standard to update the parameter.
          This is where paadec values of -3 result as the algorithm sets paadec to -3 to and then uses the highest calculated value over -3 from this time box. If nothing is over -3 this is the result (and no green dot).
          The same applies to tau and 0.5. Because the algorithm will stop iterations when paadec or tau have not changed for one cycle this will result in the calculation ending prematurely and possible incorrect values for CP.</p>

          <p>How does one fix these errors? From my examination of curves with this problem is is because of missing real max data in the max power and paadec ranges. For instance, if the user has a max power that is only 2x the CP, it is very likely that this data is not valid. A quick 20s or 60s sprint should fix things - but there is a way to check this first.</p>

          <h3 className="text-l font-bold mt-3">"What if" scenarios</h3>
          <p>Aside from identifying bad fits, the real utility of this app is allowing you to see how new max power data will effect your curve.</p>
          <p>This is where the time/power parameters comes into play. These parameters are prefilled from the max power data in each time box. It is not possible to affect the PDC by decreasing these values, only increasing them (but I did not think to program this in). Let's go through a scenario to show how it works.</p>
          <p>It we start with the previous curve can can see that CP was 273.91W (from 303W @ 726s) and W' was 21205j (from 376W @ 131s). I would need to exceed the current curve to change these values.</p>
          <p>If I increase the value of 180s from 342 W to 365 W nothing will happen as 376W at 131s is still the max power that determines the final tau in this time box. However, if I use 180s @ 366 W then there is an update. Tau has updated so W' (which is based on tau) has increased. Therefore, the CP calculation must decrease as max power has a greater percentage coming from anaerobic power - and therefore less from aerobic power. "Classic" teeter-tooter effect!</p>
          <p>If I had to run a three minute test - other than as part of testing-is-training - if I could not hit 366 W then there is not reason to do the test as AutoCP will not change. Lower values have no effect until the higher value moves out of the 90 day window. I could remove the earlier, higher, run from the calculations if I wanted the current value to be used, however.</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/tau_up.png"} alt={"Screenshot of increasing Tau"}/>

          <p>Here is another scenario. Imagine I have a CP test planned. I have been told that I need to run an 8min (480s) test. I can input time 4 as 480s and then increase the power value to see the result. Spoiler: there is no updated. Why? My testing shows that adding power files with less than 9min (540s) duration do not update the calculations.
            In fact, if I upload ONLY two files, a 3 min and an 8 min test, Stryd returns a PDC.json that does not have the anaerobic or aerobic curve information (Uploading ONLY a 3 min and 9 minute works fine). For this reason, I recommend always testing at least 9 min. On this same note, the original GC calculations had 6 min in the code. Why it seems like Stryd uses 9 min is not clear, but I really think this is the case.
            On this same note, GC uses a high point of this test at 1800s (30 min). I have not found any reason in my testing not to think this is also the Stryd value.</p>
          <p>If I had to run a 12 minute (720s) test, I could put this number into Time 4 and see that I would need to run at least 305 W to update my curve. If I did manage 305 W my CP would increase by about 2 W.</p>

          <h3 className="text-l font-bold mt-3">Fixing a bad fit. Example: paadec = -3</h3>
          <p>I uploaded two power files to Stryd (only). One with 180s @ 350 W and one with 540s @ 300 W. The paadec was -3. <br/>
          You can also see that the GC estimate total graph does not add up to have the 1s power as the max so there is a dark red showing this difference. Stryd hides this by padding the power on the lower time points to equal the max so can we can ignore this for now.</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/bad_paadec.png"} alt={"Screenshot of bad paadec fit"}/>
          <p>I used the parameters to update 10s @ 650 W and 60s @ 400 W. This created a more normal looking PDC as well as fixing the paadec issue. CP happens to be higher (as Tau is reduced by the larger alactic contribution - and therefore CP must increase) but the expected change is small. Note that the GC estimate total has the 1s power as the max. No Stryd fudge factor need be added.</p>
          <img className={"w-full xl:w-1/2"} src={"/screenshots/fix_bad_paadec.png"} alt={"Screenshot of updated fit"}/>
          <p>If I wanted to add these values to my PDC - without actually running this difficult tests  - I have a tool to create fake .fit files</p>
          <p>I think A LOT of Stryd users are probably missing real max power in the the shorter time points. It can mess up the Stryd Solution, but it is a data issue, not a AutoCP issue. </p>

        </div>

      </div>
      <Analytics/>
    </main>

  )
}

export default StrydInstructions