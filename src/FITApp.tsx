import FITGenerator from "./components/FITGenerator.tsx";

function FITApp() {
  return (
    <main className="flex flex-col p-1">
      <div className="flex h-15 shrink-0 items-end rounded-lg bg-slate-500 p-4">
        <h1 className="text-2xl md:text-3xl text-neutral-50">2-Point CP Calculation Comparison</h1>
      </div>
      <div className="mt-2 flex grow flex-col gap-2 md:flex-row">
        {/*inputs*/}
        <div className="flex flex-col shrink gap-2 rounded-lg bg-gray-50 px-2 py-2 ">


        </div>
        {/*graphs*/}
        <div className="flex gap-2 flex-col grow">
          <div>
            <FITGenerator/>
          </div>

        </div>

      </div>
    </main>
  )
}

export default FITApp