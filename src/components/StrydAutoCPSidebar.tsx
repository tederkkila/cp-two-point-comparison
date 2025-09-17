import Input from "./Input"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useMemo } from "react";
import {MMPDataPoint} from "../types/interfaces.ts"
import { FieldValues, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

interface StrydAutoCPSideBarProps {
  mmpData: MMPDataPoint[];
  setMMPData: Dispatch<SetStateAction<MMPDataPoint[]>>;
}

export default function StrydAutoCPSideBar ({mmpData, setMMPData}:StrydAutoCPSideBarProps)  {

  console.log("Sidebar running...");

  //create dataset for form
  const mmpDataForForm = useMemo(() => {
    const mmpDataForForm: Record<string, number> = {}
    for (const data in mmpData) {
      mmpDataForForm[`time-${data}`] = mmpData[data].time;
      mmpDataForForm[`power-${data}`] = mmpData[data].power;
    }
    return mmpDataForForm
  }, [mmpData])



  const {
    register, setValue, formState: { errors },
    reset,
    // handleSubmit, // watch,
  } = useForm<FieldValues>({
    defaultValues: mmpDataForForm,
    resetOptions: {
      keepDirtyValues: false,
    }
  });


  useEffect(() => {
    //update values in table as new data is loaded in parent
    for (const key in mmpDataForForm) {
      setValue(key, mmpDataForForm[key]);
    }
  }, [mmpDataForForm, setValue])

  //min value for an input to prevent zero (and log explosion)
  const minValue = 1;

  const handleInputChange = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    const id: string = event.target.id;
    let value: string = event.target.value;

    //console.log(id)

    const valueNumber = parseInt(value, 10);

    if (isNaN(valueNumber)) {
      reset(mmpDataForForm);
      setMMPData(mmpData);
      return
    }

    value = (parseInt(value, 10) < minValue) ? minValue.toString() : value;

    setValue(id, value, {
      shouldDirty   : true,
      shouldTouch   : true,
      shouldValidate: true,
    });

    //add value back to original mmpData
    const mmpRegex = /(\w+)-(\d+)/;
    const match = id.match(mmpRegex);

    if (match) {
      const paramName = match[1]; // 'time' or 'power'
      const index: number = parseInt(match[2], 10); // '0'

      const updatedMMPdata = [...mmpData]
      const oldRow: MMPDataPoint = updatedMMPdata[index];

      oldRow[paramName] = parseInt(value, 10);

      setMMPData(updatedMMPdata);

    } else {
      console.log('No match found.');
    }


  }, 600);




  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800">PARAMETERS</h2>

      <hr className="border-2 border-neutral-500"/>

        {mmpData.map((item: MMPDataPoint, index:number) => (
          <div className="" key={`timepower-${index}`}>
            <div className="flex flex-row shrink" key={`timepower-row-${index}`}>
              <div className="flex col shrink gap-2" key={`timepower-col-${index}`}>
                <Input
                  id={`time-${index}`}
                  key={`time-${index}`}
                  label={`Time ${index+1}`}
                  type="number"
                  disabled={false}
                  register={register}
                  errors={errors}
                  required
                  handleChange={handleInputChange}
                  min={minValue}
                  placeholder={item.time.toString()}
                />
                <Input
                  id={`power-${index}`}
                  key={`power-${index}`}
                  label={`Power ${index+1}`}
                  type="number"
                  disabled={false}
                  register={register}
                  errors={errors}
                  required
                  handleChange={handleInputChange}
                  min={minValue}
                />

              </div>

            </div>
            <hr className="flex w-full border-1 border-neutral-200 mt-2" />
          </div>

        ))}


    </>
  )
}