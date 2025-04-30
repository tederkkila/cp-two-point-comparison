import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Input from "./Input.tsx";
import { ChangeEvent } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Switch } from '@base-ui-components/react/switch';
import styles from './index.module.css';
import { useNavigate } from 'react-router-dom';
import {useParams} from "react-router-dom";

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

// for storing legacy values when test one disabled
let linearDataPreCheck: LinearGraphData;
// default state is to not disable Test One (show it)
let disableTestOne: boolean = false;

export default function SideBar({ linearData, setLinearData }: SideBarProps) {
  //console.log("rendering sidebar")

  //extract params from route (which gets from the path)
  const params = useParams();
  const navigate = useNavigate();
  //console.log('params')
  //console.log(params)

  //convert parameters to numbers
  const paramData: Record<string, number> = {};

  useEffect(() => {
    //set intial precheck values so it is never empty
    linearDataPreCheck = {
      ...linearData
    };

    //console.log("running param use effect")

    for (const param in params) {

      const paramValue = params[param];
      paramData[param] = parseInt(paramValue!, 10);
    }
    //console.log(paramData)
    //combine the default data with the parameter data
    if (Object.keys(params).length !== 0 && !paramData.testOneShortTime) {
      //console.log("setting disableTestOne to true as testOneShorTime is missing from params")
      disableTestOne = true;
    }

    setLinearData ({
      ...linearData,
      ...paramData,
    });

  }, []);

  //console.log(`disableTestOne ${disableTestOne}`)

  //min value for an input to prevent zero (and log explosion)
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
    register, setValue, formState: { errors }, reset,
    // handleSubmit, // watch,
  } = useForm<FieldValues>({
    defaultValues: linearData,
    resetOptions: {
      keepDirtyValues: false,
    }
  });

  const disableTestOneInputs = () => {
    // console.log("running: disableTestOneInputs")
    //disable inputs
    sett1STDisabled(true);
    sett1SWDisabled(true);
    sett1LTDisabled(true);
    sett1LWDisabled(true);

    //keep current values in case no change is made before re-enable
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
    //console.log(linearDataPreCheck);
    //console.log("running setLinearData in disableTestOneInputs")
    setLinearData(linearData)
  }

  const enableTestOneInputs = () => {
    //console.log("running: enableTestOneInputs")

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
    //console.log("running setLinearDat in enableTestOneInputs")
    setLinearData(linearData);

  }

  useEffect(() => {
    //console.log(`disableTestOne first run useEffect (disableTestOne: ${disableTestOne})`)
    //run on first render
    //console.log(`disableTestOne: ${disableTestOne}`);
    if (disableTestOne) {
      disableTestOneInputs();
    }
  }, []);

  useEffect(() => {
    //console.log(`update URL useEffect (disableTestOne: ${disableTestOne})`)
    let path:string = '';
    path += `/${linearData.testTwoShortTime}`;
    path += `/${linearData.testTwoShortWatt}`;
    path += `/${linearData.testTwoLongTime}`;
    path += `/${linearData.testTwoLongWatt}`;
//console.log (linearDataPreCheck)
    if (!disableTestOne && linearDataPreCheck) {
      path += `/${linearDataPreCheck.testOneShortTime}`;
      path += `/${linearDataPreCheck.testOneShortWatt}`;
      path += `/${linearDataPreCheck.testOneLongTime}`;
      path += `/${linearDataPreCheck.testOneLongWatt}`;
    }
    navigate(path, { replace: true });
    //console.log(`new path: ${path}`)
  }, [linearData, navigate]);

  const handleInputChange = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    //console.log(`Input value ${event.target.id} changed to:`, event.target.value);
    const id: string = event.target.id;
    let value: string = event.target.value;

    const valueNumber = parseInt(value, 10);

    if (isNaN(valueNumber)) {
      reset(linearData);
      setLinearData(linearData);

      // console.log(value);
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
    checked: boolean, //event: Event
  ) => {
    //console.log(event) //console.log(checked)
    //console.log("handleSwitchChange checked:", checked);
    if (checked) {
      disableTestOne = false;
      enableTestOneInputs();
    } else {
      disableTestOne = true;
      disableTestOneInputs();
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
          <Switch.Root id="t1Toggle" name="t1Toggle" checked={!disableTestOne} className={styles.Switch}
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
