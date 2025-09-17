import { Decoder, Stream, Profile, Encoder, Utils } from "@garmin/fitsdk";
import { useEffect, useState } from "react";

const fetchBinaryFile = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Failed to fetch binary file:", error);
    return null;
  }
};

const handleBinaryData = (arrayBuffer: ArrayBuffer | null) => {

  if (!arrayBuffer) {
    return;
  }

  const streamFile = Stream.fromArrayBuffer(arrayBuffer);
  const decoderFile = new Decoder(streamFile);
  //console.log("isFIT (file): " + decoderFile.isFIT());
  //console.log("checkIntegrity: " + decoderFile.checkIntegrity());

  const { messages, errors } = decoderFile.read();

  if (errors.length > 0) {
    console.log(errors);
  }
  console.log(messages);

};

const handleDownloadFile = (
  arrayBuffer: ArrayBuffer | null,
  durationShort: number,
  powerShort: number,
  durationLong: number,
  powerLong: number,
) => {
  if (!arrayBuffer) {
    return;
  }
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' }); // Optional: Set the MIME type
  const formattedDate = getFormattedDate();
  let powerInfo = `_${powerShort}W${durationShort}s`;
  if (durationLong != 0) {
    powerInfo += `_${powerLong}W${durationLong}s`;
  }
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a download link
  const link = document.createElement("a");
  link.href = url;
  link.download = `fakeCP-${formattedDate}${powerInfo}.fit`; // Set the desired filename
  document.body.appendChild(link);
  link.click();

  // Clean up the URL object
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function getFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export default function FITGenerator() {


  //decode real data file for testing
  const [binaryData, setBinaryData] = useState<ArrayBuffer | null>(null);
  const url = '/fit/Lunch_Run.fit';

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchBinaryFile(url);
      setBinaryData(data);
    };

    fetchData();
  }, [url]);

  useEffect(() => {
    console.log("handleBinaryData Sample");
    handleBinaryData(binaryData);
  }, [binaryData]);


  // The starting timestamp for the activity
  const semicirclesPerMeter = 107.173;
  const now = new Date();
  const localTimestampOffset = now.getTimezoneOffset() * -60;
  const startTime = Utils.convertDateToDateTime(now);

  const mesgs = [];

// Every FIT file MUST contain a File ID message
  mesgs.push({
    mesgNum: Profile.MesgNum.FILE_ID,
    type: "activity",
    manufacturer: "stryd",
    product: 0,
    timeCreated: startTime,
    serialNumber: 1234,
  });

  //start the timer
  mesgs.push({
    mesgNum: Profile.MesgNum.EVENT,
    timestamp: startTime,
    event: "timer",
    eventType: "start",
    eventGroup: 0,
  });

  let timestamp = startTime;
  const durationShort = 60*3;
  const powerShort = 400;
  const durationLong = 0;//60*12;
  const powerLong = 10;
  const durationEasy = 0;//60;
  const powerEasy = 10;
  const easyMultiplier = 10;

  let power = powerEasy;
  const startShort:number = durationEasy;
  const stopShort:number = startShort + durationShort;
  const startLong:number = stopShort + durationEasy*easyMultiplier;
  const stopLong:number = startLong + durationLong;
  const stopFinal:number = stopLong + durationEasy;

  console.log("creating file W: ", durationShort, powerShort);
  for (let i = 0; i <= stopFinal; i++) {

    if (startShort <= i && i < stopShort) {
      power = powerShort;
    } else if (startLong <= i && i < stopLong) {
      power = powerLong;
    } else {
      power = powerEasy;
    }

    mesgs.push({
      mesgNum: Profile.MesgNum.RECORD,
      timestamp: timestamp,
      distance: i, // Ramp
      //enhancedSpeed: 1, // Flat Line
      //heartRate: (Math.sin(twoPI * (0.01 * i + 10)) + 1.0) * 127.0, // Sine
      //cadence: i % 255, // Sawtooth
      power: power, // Square
      enhancedAltitude: 0,
      positionLat: 0, // Flat Line
      positionLong: i * semicirclesPerMeter, // Ramp

    });

    timestamp++;
  }

  // Stop the timer
  mesgs.push({
    mesgNum: Profile.MesgNum.EVENT,
    timestamp: timestamp,
    event: "timer",
    eventType: "stop",
    eventGroup: 0,
  });
  mesgs.push({
    mesgNum: Profile.MesgNum.EVENT,
    timestamp: timestamp,
    event: "session",
    eventType: "stopDisableAll",
    eventGroup: 0,
  });

  // Every FIT ACTIVITY file MUST contain at least one Lap message
  //lap 0 start short
  mesgs.push({
    mesgNum: Profile.MesgNum.LAP,
    messageIndex: 0,
    startTime: startTime,
    timestamp: startTime + startShort,
    avgPower: powerEasy,
    totalElapsedTime: durationEasy - 1,
    totalTimerTime: (startTime + startShort) - startTime - 1,
    event: "lap",
    eventType: "stop",
    lapTrigger: "manual",
    sport: "running",
  });

  //lap 1 end short interval
  mesgs.push({
    mesgNum: Profile.MesgNum.LAP,
    messageIndex: 1,
    startTime: startTime + startShort,
    timestamp: startTime + stopShort,
    avgPower: powerShort,
    totalElapsedTime: durationShort - 1,
    totalTimerTime: stopShort - 1,
    event: "lap",
    eventType: "stop",
    lapTrigger: "manual",
    sport: "running",
  });

  //lap 2 start long interval
  mesgs.push({
    mesgNum: Profile.MesgNum.LAP,
    messageIndex: 2,
    startTime: startTime + stopShort,
    timestamp: startTime + startLong,
    avgPower: powerEasy,
    totalElapsedTime: startLong - stopShort - 1,
    totalTimerTime: startLong - 1,
    event: "lap",
    eventType: "stop",
    lapTrigger: "manual",
    sport: "running",
  });

  //lap 3 end long interval
  mesgs.push({
    mesgNum: Profile.MesgNum.LAP,
    messageIndex: 3,
    startTime: startTime + startLong,
    timestamp: startTime + stopLong,
    avgPower: powerLong,
    totalElapsedTime: durationLong - 1,
    totalTimerTime: stopLong - 1,
    event: "lap",
    eventType: "stop",
    lapTrigger: "manual",
    sport: "running",
  });

  //lap 4 stop final
  mesgs.push({
    mesgNum: Profile.MesgNum.LAP,
    messageIndex: 4,
    startTime: startTime + stopLong,
    timestamp: startTime + stopFinal,
    avgPower: powerEasy,
    totalElapsedTime: durationEasy,
    totalTimerTime: stopFinal,
    event: "lap",
    eventType: "stop",
    lapTrigger: "sessionEnd",
    sport: "running",
  });

  // Every FIT ACTIVITY file MUST contain at least one Session message
  mesgs.push({
    mesgNum: Profile.MesgNum.SESSION,
    messageIndex: 0,
    timestamp: timestamp,
    startTime: startTime,
    totalElapsedTime: timestamp - startTime,
    totalTimerTime: timestamp - startTime,
    sport: "running",
    subSport: "generic",
    firstLapIndex: 0,
    numLaps: 1,
    event: "lap",
    eventType: "stop",
  });

  // Every FIT ACTIVITY file MUST contain EXACTLY one Activity message
  mesgs.push({
    mesgNum: Profile.MesgNum.ACTIVITY,
    timestamp: timestamp,
    numSessions: 1,
    localTimestamp: timestamp + localTimestampOffset,
    totalTimerTime: timestamp - startTime,
    event: "activity",
    eventType: "stop",
    type: "manual",
  });


  try {
    // Create an Encoder and provide the developer data field descriptions
    const encoder = new Encoder();

    mesgs.forEach((mesg) => {
      encoder.writeMesg(mesg);
    });

    // Close the encoder
    const uint8Array = encoder.close();

    //console.log(uint8Array.buffer);
    handleDownloadFile(
      uint8Array.buffer,
      durationShort,
      powerShort,
      durationLong,
      powerLong,
      );
    handleBinaryData(uint8Array.buffer);

    // Write the bytes to a file
    //fs.writeFileSync("test/data/encode-activity-recipe.fit", uint8Array);

    //expect(uint8Array.length).toBe(108485);
  }
  catch (error) {
    //console.error(error.name, error.message, JSON.stringify(error?.cause, null, 2));
    console.log(error)
    throw error;
  }

  return (
    <>

    </>
  )
}