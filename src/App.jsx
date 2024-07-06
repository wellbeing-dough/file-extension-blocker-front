import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const apiUrl = 'https://file-extension-blocker-wellbeing-dough.store/api';
const customExtensionMaxCount = 200;

function App() {
  const [customTags, setCustomTags] = useState([]);
  const [fixedTags, setFixedTags] = useState([]);
  const [fixedTagsAll, setFixedTagsAll] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedExtensions, setSelectedExtensions] = useState({});

  useEffect(() => {
    fetchTagsAndFixedExtensions();
  }, []);

  const fetchTagsAndFixedExtensions = () => {
    const customExtensionUrl = `${apiUrl}/v1/file/all/block-extensions`;
    const fixedExtensionUrl = `${apiUrl}/v1/file/fixed/block-extensions`;

    Promise.all([
      axios.get(customExtensionUrl),
      axios.get(fixedExtensionUrl)
    ])
      .then(([customResponse, fixedResponse]) => {
        const customExtensions = customResponse.data.customFileExtensions;
        const fixedExtensionsAll = customResponse.data.fixedFileExtensions;
        const fixedExtensions = fixedResponse.data.data;

        setCustomTags(customExtensions);
        setFixedTagsAll(fixedExtensionsAll);
        setFixedTags(fixedExtensions);
        updateSelectedExtensions(fixedExtensionsAll, fixedExtensions);
      })
      .catch(error => {
        console.error('Error fetching extensions:', error);
        alert(`Error fetching extensions: ${error.message}`);
      });
  };

  const updateSelectedExtensions = (fixedExtensionsAll, fixedExtensions) => {
    const fixedExtensionsMap = fixedExtensionsAll.reduce((acc, ext) => {
      acc[ext.extensionName.toLowerCase()] = false;
      return acc;
    }, {});

    const fixedExtNames = fixedExtensions.map(ext => ext.extensionName.toLowerCase());
    fixedExtNames.forEach(ext => {
      if (fixedExtensionsMap.hasOwnProperty(ext)) {
        fixedExtensionsMap[ext] = true;
      }
    });

    setSelectedExtensions(fixedExtensionsMap);
  };

  const handleAddTag = (extensionName) => {
    if (extensionName.length > 20 || customTags.length >= customExtensionMaxCount) {
      alert(`확장자의 길이가 20자를 초과하거나 최대 ${customExtensionMaxCount}개의 확장자가 초과되었습니다.`);
      return;
    }
    const customExtensionUrl = `${apiUrl}/v1/file/custom/block-extensions`;

    axios.post(customExtensionUrl, { extensionName })
      .then(() => {
        fetchTagsAndFixedExtensions();
        setInputValue('');
        alert('확장자가 추가되었습니다.');
      })
      .catch(error => {
        console.error('Error adding custom extension:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          alert(`Error adding extension: ${error.response.data.statusMessage}`);
        } else {
          alert(`Error adding extension: ${error.message}`);
        }
      });
  };

  const handleRemoveTag = (tagToRemove) => {
    const deleteUrl = `${apiUrl}/v1/file/custom/${tagToRemove.customFileExtensionId}/block-extensions`;
    axios.delete(deleteUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(() => {
        fetchTagsAndFixedExtensions();
        alert('확장자가 삭제되었습니다.');
      })
      .catch(error => {
        console.error('Error removing custom extension:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          alert(`Error deleting extension: ${error.response.data.statusMessage}`);
        } else {
          alert(`Error deleting extension: ${error.message}`);
        }
      });
  };

  const handleCheckboxChange = (extension) => {
    const newSelectedExtensions = {
      ...selectedExtensions,
      [extension]: !selectedExtensions[extension],
    };
    setSelectedExtensions(newSelectedExtensions);

    if (newSelectedExtensions[extension]) {
      handleAddTag(extension);
    } else {
      const tagToRemove = fixedTagsAll.find(tag => tag.extensionName.toLowerCase() === extension);
      if (tagToRemove) {
        handleRemoveTag(tagToRemove);
      }
    }
  };

  return (
    <div className="container">
      <div className="checkbox-container">
        {fixedTags.map((tag) => (
          <label key={tag.blockFixedFileExtensionId}>
            <input 
              type="checkbox" 
              checked={selectedExtensions[tag.extensionName.toLowerCase()] || false} 
              onChange={() => handleCheckboxChange(tag.extensionName.toLowerCase())} 
            />
            {tag.extensionName}
          </label>
        ))}
      </div>
      <div className="input-container">
        <input 
          type="text" 
          placeholder="확장자 입력" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={20}
        />
        <button onClick={() => handleAddTag(inputValue)}>추가</button>
      </div>
      <div className="tag-container">
        {customTags.map((tag) => (
          <div key={tag.customFileExtensionId} className="tag">
            {tag.extensionName}
            <button onClick={() => handleRemoveTag(tag)}>x</button>
          </div>
        ))}
      </div>
      <div className="custom-count">
        {`${customTags.length}/${customExtensionMaxCount}`}
      </div>
    </div>
  );
}

export default App;
