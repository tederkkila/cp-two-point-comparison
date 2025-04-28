import { Dispatch, SetStateAction, useState, useEffect } from "react";
import Input from "./Input.tsx";
import { ChangeEvent } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Switch } from '@base-ui-components/react/switch';
import styles from './index.module.css';

interface LinearGraphData {
  testOneShortTime: number;
  testOneShortWatt: number;
  testOneLongTime: number;
  testOneLongWatt: number;
  testTwoShortTime: number;
  testTwoShortWatt: number;
  testTwoLongTime: number;
  testTwoLongWatt: number;
}

interface SideBarProps {
  linearData: LinearGraphData;
  setLinearData: Dispatch<SetStateAction<LinearGraphData>>;
}

let linearDataPreCheck: LinearGraphData;

export default function SideBar({ linearData, setLinearData }: SideBarProps) {

  //console.log(linearData);
  //console.log(setLinearData);

  //console.log("loading SideBar");
  //console.log(linearData);

  const minValue = 1;

  const t2STDisabled = false;
  const t2SWDisabled = false;
  const t2LTDisabled = false;
  const t2LWDisabled = false;
  const [t1STDisabled, sett1STDisabled] = useState<boolean>(false);
  const [t1SWDisabled, sett1SWDisabled] = useState<boolean>(false);
  const [t1LTDisabled, sett1LTDisabled] = useState<boolean>(false);
  const [t1LWDisabled, sett1LWDisabled] = useState<boolean>(false);

  const {
    register,
    // handleSubmit,
    setValue,
    // watch,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: linearData,
    resetOptions: {
      keepDirtyValues: false,
    }
  });

  useEffect(() => {
    //console.log("useEffect called");
    //console.log(linearData);
    setLinearData(linearData);
    reset(linearData);
  }, [reset, linearData, setLinearData]);

  const handleInputChange = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    //console.log(`Input value ${event.target.id} changed to:`, event.target.value);
    const id: string = event.target.id;
    let value: string = event.target.value;

    const valueNumber = parseInt(value, 10);

    if (isNaN(valueNumber)) {
      reset(linearData);
      setLinearData(linearData);

      console.log(value);
      return
    }

    value = (parseInt(value, 10) < minValue) ? minValue.toString() : value;

    setValue(id, value, {
      shouldDirty   : true,
      shouldTouch   : true,
      shouldValidate: true,
    });

    linearData = {
      ...linearData,
      [id]: parseInt(value, 10),
    }

    //console.log("before set");
    //console.log(linearData);
    setLinearData(linearData);

    //once a change is made we do not revert back again.
    linearDataPreCheck = {
      ...linearData,
    };

    //console.log(linearDataPreCheck);
  }, 600);


  const handleSwitchChange = (
    checked: boolean,
    //event: Event
  ) => {
    //console.log(event)
    //console.log(checked)
    if (checked) {

      //enable all
      sett1STDisabled(false);
      sett1SWDisabled(false);
      sett1LTDisabled(false);
      sett1LWDisabled(false);

      //console.log(linearDataPreCheck)
      linearData = {
        ...linearData,
        testOneShortTime: linearDataPreCheck.testOneShortTime,
        testOneShortWatt: linearDataPreCheck.testOneShortWatt,
        testOneLongTime : linearDataPreCheck.testOneLongTime,
        testOneLongWatt : linearDataPreCheck.testOneLongWatt,
      }

      //console.log(linearData)
      reset(linearData);
      setLinearData(linearData);

    } else {
      //disable inputs
      sett1STDisabled(true);
      sett1SWDisabled(true);
      sett1LTDisabled(true);
      sett1LWDisabled(true);

      //keep current values in case no change is made before reenable
      linearDataPreCheck = {
        ...linearData
      };

      //update linearData to reflect using previous values
      //inputs are updated to be equal to current
      linearData = {
        ...linearData,
        testOneShortTime: linearData.testTwoShortTime,
        testOneShortWatt: linearData.testTwoShortWatt,
        testOneLongTime : linearData.testTwoLongTime,
        testOneLongWatt : linearData.testTwoLongWatt,
      }
      //console.log(linearData);
      setLinearData(linearData)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800">PARAMETERS</h2>
      <hr className="border-2 border-neutral-500"/>
      <h3 className="text-lg font-light text-slate-600">Current Test</h3>
      <hr className="border-1 border-neutral-200"/>
      <h4>Short Duration</h4>
      <Input
        id="testTwoShortTime"
        label="Time (s)"
        type="number"
        disabled={t2STDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <Input
        id="testTwoShortWatt"
        label="Power (W)"
        type="number"
        disabled={t2SWDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <h4>Long Duration</h4>
      <Input
        id="testTwoLongTime"
        label="Time (s)"
        type="number"
        disabled={t2LTDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <Input
        id="testTwoLongWatt"
        label="Power (W)"
        type="number"
        disabled={t2LWDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <hr className="mt-4 border-2 border-neutral-500"/>

      <div className="flex">
        <div className="flex flex-col grow">
          <h3 className="flex text-lg font-light text-slate-600">Previous Test</h3>
        </div>
        <div className="flex flex-col justify-end">
          <Switch.Root id="t1Toggle" name="t1Toggle" defaultChecked className={styles.Switch}
                       onCheckedChange={handleSwitchChange}>
            <Switch.Thumb className={styles.Thumb}/>
          </Switch.Root>
        </div>
      </div>
      <hr className="border-1 border-neutral-200"/>
      <h4>Short Duration</h4>
      <Input
        id="testOneShortTime"
        label="Time (s)"
        type="number"
        disabled={t1STDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <Input
        id="testOneShortWatt"
        label="Power (W)"
        type="number"
        disabled={t1SWDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <h4>Long Duration</h4>
      <Input
        id="testOneLongTime"
        label="Time (s)"
        type="number"
        disabled={t1LTDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
      <Input
        id="testOneLongWatt"
        label="Power (W)"
        type="number"
        disabled={t1LWDisabled}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min={minValue}
      />
    </>
  );
}
