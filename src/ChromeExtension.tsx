import { Analytics } from "@vercel/analytics/react";

function StrydInstructions() {

  return (

    <main className="flex flex-col p-1">

      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">Chrome Extension Privacy Policy</h1>
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
          <p>This Chrome extension does not share any personal information. It only downloads your Stryd power duration curve data (with username, critical power, and date) for analysis and archiving. The data is stored locally on your device and is not transmitted to any third-party servers.</p>
          <p>However, does collect and store data from your browser to function properly:</p>
          <ul className="list-disc list-inside space-y-1 dark:text-gray-400">
            <li>Collected Stryd data includes:</li>
            <ul className="list-[circle] list-inside ps-5 space-y-1">
              <li>The user's authentication token</li>
              <li>The user's 19 digit user identifier from the url.</li>
              <li>The user's username (for naming the downloaded file)</li>
              <li>The user's critical power (for naming the downloaded file)</li>
              <li>The user's power duration curve data (which should be considered Health Data).</li>
            </ul>
            <li>Storage of downloaded user authentication token and user ID locally on your device</li>
          </ul>
        </div>

      </div>
      <Analytics/>
    </main>

  )
}

export default StrydInstructions