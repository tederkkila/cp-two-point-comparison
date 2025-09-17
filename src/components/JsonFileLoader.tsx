import React, { useState, useRef, ChangeEvent } from 'react';

interface InputComponentProps {
  onDataSubmit: (data: JSON) => void;
}

const JsonFileLoader: React.FC<InputComponentProps> = ({ onDataSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jsonData, setJsonData] = useState<JSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFileName(file.name)

    if (!file) {
      setJsonData(null);
      return;
    }

    if (file.type !== 'application/json') {
      setError('Please select a valid JSON file.');
      setJsonData(null);
      return;
    }

    const reader = new FileReader();

    // The 'onload' event fires when the file has been successfully read
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      try {
        // Attempt to parse the JSON string into a JavaScript object
        const parsedData: JSON = JSON.parse(fileContent);
        setJsonData(parsedData);
        setError(null);
        onDataSubmit(parsedData);
      } catch (err) {
        // Handle parsing errors, for example, if the file is not valid JSON
        setError(`Error parsing JSON file. Please ensure it is correctly formatted. ${err}`);
        setJsonData(null);
        console.log(jsonData)
      }
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setJsonData(null);
    };

    // Read the file content as text
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // Programmatically click the hidden input
  };


  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hide the actual file input
      />
      <button
        onClick={handleButtonClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          // Add more styling as needed
        }}
      >
        Upload File
      </button>
      {selectedFileName && (
        <p style={{ marginLeft: '10px', display: 'inline-block' }}>Selected file: {selectedFileName}</p>
      )}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

    </div>
  );
};

export default JsonFileLoader;