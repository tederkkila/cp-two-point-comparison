import Input from "./Input.tsx";
import { ChangeEvent } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useDebouncedCallback} from "use-debounce";

interface SideBarProps {
  linearData: object;
  setLinearData: any;
}

export default function SideBar({ linearData, setLinearData }: SideBarProps) {

  //console.log(linearData);
  //console.log(setLinearData);

  const isLoading = false;
  //console.log("loading SideBar");
  //console.log(linearData);

  const minValue = 50;

  const {
    register,
    // handleSubmit,
    setValue,
    // watch,
    formState: { errors },
    // reset,
  } = useForm<FieldValues>({
    defaultValues: linearData,
  });

  const handleInputChange = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    //console.log(`Input value ${event.target.id} changed to:`, event.target.value);
    const id:string = event.target.id;
    let value:string = event.target.value;

    value = (parseInt(value, 10) < minValue) ? minValue.toString() : value;

    setValue(id, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    //linearData[id] = event.target.value;
    linearData = {
      ...linearData,
      [id] : parseInt(value, 10),
    }
    //console.log("before set");
    //console.log(linearData);
    setLinearData(linearData);
  }, 600);

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800">PARAMETERS</h2>
      <hr className="border-2 border-neutral-500"/>
      <h3 className="text-lg font-light text-slate-600">TEST ONE</h3>
      <hr className="border-1 border-neutral-200"/>

      <h4>Short Duration</h4>
      <Input
        id="testOneShortTime"
        label="Time (s)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <Input
        id="testOneShortWatt"
        label="Power (W)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <h4>Long Duration</h4>
      <Input
        id="testOneLongTime"
        label="Time (s)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <Input
        id="testOneLongWatt"
        label="Power (W)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <hr className="mt-4 border-2 border-neutral-500"/>
      <h3>TEST TWO</h3>
      <hr className="border-1 border-neutral-200"/>
      <h4>Short Duration</h4>
      <Input
        id="testTwoShortTime"
        label="Time (s)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <Input
        id="testTwoShortWatt"
        label="Power (W)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <h4>Long Duration</h4>
      <Input
        id="testTwoLongTime"
        label="Time (s)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
      <Input
        id="testTwoLongWatt"
        label="Power (W)"
        type="number"
        disabled={isLoading}
        register={register}
        errors={errors}
        required
        handleChange={handleInputChange}
        min = {minValue}
      />
    </>
  );
}
