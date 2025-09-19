

function StrydInstructions() {

  return (

    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">How to Download pdc.json file</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">
          <p>Back to <a href="/StrydAutoCP"
                        className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline">
            Stryd AutoCP Model
            <svg className="w-4 h-4 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </a></p>

        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow rounded-lg bg-gray-50 px-2 py-2">
          <h3 className="text-l font-bold">Go to Stryd PowerCenter Website in Google Chrome or Safari</h3>
          <p>On a desktop or laptop: Navigate to <a href={"https://stryd.com/powercenter/"}>stryd.com/powercenter/</a> in Google Chrome or Safari</p>

          <h3 className="text-l font-bold mt-3">Open the Developer Tools</h3>
          <p>You can either </p>
          <ul className="list-disc list-inside dark:text-gray-400">
            <li>right-click on the screen and choose "inspect"</li>
            <li>or, press &lt;function key&gt; + F12</li>
          </ul>
          <img src={"/screenshots/opentools.png"} alt={"Screenshot of opening tools"}/>

          <h3 className="text-l font-bold mt-3">Find the pdc file</h3>
          <p>These are the steps to display the content of the pdc file</p>
          <ol className="list-decimal list-inside dark:text-gray-400">
            <li>Select the 'Network' tab</li>
            <li>Enter 'pdc' in the search box</li>
            <li>Refresh your page</li>
            <li>Click on the entry 'pdc?include_breakdown=1'</li>
            <li>Select 'Response' tab for this entry</li>
          </ol>
          <img src={"/screenshots/networkrequest.png"} alt={"Screenshot of network request"}/>

          <h3 className="text-l font-bold mt-3">Save the pdc file</h3>
          <p>Now that you have located the file we need to save the content to your local machine</p>
          <ol className="list-decimal list-inside dark:text-gray-400">
            <li>Create a new file on your computer called pdc.json (or pdc_ted_20250911.json to have a naming scheme)</li>
            <li>Use ctrl+A to select ALL of the text in the 'Response' tab. It is a lot of text! </li>
            <li>Use ctrl+C to copy the text into your pdc.json</li>
            <li>Save your file. The file will be 1-2MB in size</li>
          </ol>


        <h3 className="text-l font-bold mt-3">You can now use the Styrd AutoCP Model Viewer</h3>
        <p>You now can use this .json file in the viewer</p>
        <p>Here are some links to test file (right-click to 'Save as'): </p>
        <ul className="list-decimal list-inside dark:text-gray-400">
          <li><a className={"inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"} href={"/fit/pdc_ted_june16th_untouched.json"}>Weak Alactic / Weak Anaerobic PDC (has tau warning)</a></li>
          <li><a className={"inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"} href={"/fit/pdc_ted_aug02_350W.json"}>Weak Alactic / Strong Anaerobic PDC (has paa_dec warning)</a></li>
          <li><a className={"inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"} href={"/fit/pdc_ted_sep09_untouched.json"}>Balanced PDC (CP not maxed, but close)</a></li>
        </ul>

        </div>

      </div>
    </main>

  )
}

export default StrydInstructions