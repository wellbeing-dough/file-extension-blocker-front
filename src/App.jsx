import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const apiUrl = 'https://file-extension-blocker-wellbeing-dough.store/api';
const customExtensionMaxCount = 200;

function App() {
  // customTag 차단된 커스텀 태그 리스트들 배열
  const [customTags, setCustomTags] = useState([]);
  // fixedTags 이게 전체 고정 차단 태그 리스트 배역
  const [fixedTags, setFixedTags] = useState([]);
  // fixedTagsAll 차단된 고정 차단 태그 리스트 배열
  const [fixedTagsAll, setFixedTagsAll] = useState([]);
  // input값 string
  const [inputValue, setInputValue] = useState('');
  // 전체 체크박스 상태 객체
  const [selectedExtensions, setSelectedExtensions] = useState({});
  // 화면에 뿌려지는 에러 메시지 상태 string
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchTagsAndFixedExtensions();
  }, []);

  const fetchTagsAndFixedExtensions = () => {
    const customExtensionUrl = `${apiUrl}/v1/file/all/block-extensions`;
    const fixedExtensionUrl = `${apiUrl}/v1/file/fixed/block-extensions`;

    Promise.all([ //api 두번 첫번째 반환값을 두번째 호출값에 써야할 경우 사용
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
      });
  };

  const updateSelectedExtensions = (fixedExtensionsAll, fixedExtensions) => {
    const fixedExtensionsMap = fixedExtensionsAll.reduce((acc, ext) => { //reduce 는 배열에서 한번씩 돌면서 안에 함수를 실행
      acc[ext.extensionName.toLowerCase()] = false;   // 소문자로 바꿔주고 기본값 체크박스 해제로 설정
      return acc;
    }, {});

    const fixedExtNames = fixedExtensions.map(ext => ext.extensionName.toLowerCase());
    fixedExtNames.forEach(ext => {     //fixedExtNames돌면서 함수를 실행할 뿐이지 return 하진않음
      if (fixedExtensionsMap.hasOwnProperty(ext)) {
        fixedExtensionsMap[ext] = true;
      }
    });

    setSelectedExtensions(fixedExtensionsMap);
  };

  const handleAddTag = (extensionName) => {
    if (extensionName.length > 20 || customTags.length >= customExtensionMaxCount) {
      setErrorMessage(`확장자의 길이가 20자를 초과하거나 최대 ${customExtensionMaxCount}개의 확장자가 초과되었습니다.`);
      return;
    }
    const customExtensionUrl = `${apiUrl}/v1/file/custom/block-extensions`;

    axios.post(customExtensionUrl, { extensionName })
      .then(() => {
        fetchTagsAndFixedExtensions();
        setInputValue('');
        setErrorMessage('');
      })
      .catch(error => {
        console.error('Error adding custom extension:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          setErrorMessage(error.response.data.statusMessage);
        } else {
          setErrorMessage('확장자를 추가하는 동안 오류가 발생했습니다.');
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
        setErrorMessage('');
      })
      .catch(error => {
        console.error('Error removing custom extension:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          setErrorMessage(error.response.data.statusMessage);
        } else {
          setErrorMessage('확장자를 삭제하는 동안 오류가 발생했습니다.');
        }
      });
  };

  const handleCheckboxChange = (extension) => {
    const newSelectedExtensions = {
      ...selectedExtensions,  //원래 있떤 체크박스는 유지
      [extension]: !selectedExtensions[extension],  // !표는 반대라는 뜻인데 체크되어있으면 체크 풀고 체크 안되어있으면 체크 하라
    };
    setSelectedExtensions(newSelectedExtensions);   // setSelectedExtensions메서드에 붙혀넣기 state를 변경되야 화면이 바뀌니까


    if (newSelectedExtensions[extension]) {   //만약에 체크를 새로 했으면 handleAddTag
      handleAddTag(extension);
    } else {  // 안했으면 제거해라
      const tagToRemove = fixedTagsAll.find(tag => tag.extensionName.toLowerCase() === extension);  // fixedTagsAll에 있는 상태 중에서 이름이랑 똑같은 애가 있는지(뭘 제거해야되는지 판단 기ㅏ준은 extensionName)
      if (tagToRemove) {
        handleRemoveTag(tagToRemove);
      }
    }
  };

  return (
    <div className="container">
      {errorMessage && <div className="error-message">{errorMessage}</div>}
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
