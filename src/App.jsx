import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// -------------------------------------------------------------
// [1] Firebase 설정 (제공해주신 키 적용)
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBau3d7cu2_SDHzVoRNhaXC4bmqEzxhYpY",
  authDomain: "reliability-testing-management.firebaseapp.com",
  projectId: "reliability-testing-management",
  storageBucket: "reliability-testing-management.firebasestorage.app",
  messagingSenderId: "294210967077",
  appId: "1:294210967077:web:42b899f1baab30b490d1cc",
  measurementId: "G-QT7ZPE2YXG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const MY_APP_ID = "reliability-app";

// -------------------------------------------------------------
// [2] 아이콘 컴포넌트 (외부 라이브러리 의존성 방지)
// -------------------------------------------------------------
const AlertCircle = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const Plus = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevronDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg>;
const ChevronUp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15"/></svg>;
const Trash2 = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const Edit = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const Square = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>;
const XIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// -------------------------------------------------------------
// [3] 데이터 및 유틸리티
// -------------------------------------------------------------
const DEFAULT_TESTS = ['IP', 'EMC', '진동', '충격'];
const TEST_STANDARD_OPTIONS = {
  'IP': ['없음', 'IP65', 'IP66', 'IP67', '직접입력'],
  'EMC': ['없음', 'EN IEC 61000-6-2, 61000-6-4', 'EN IEC 61326-1, 61326-2-3', '직접입력'],
  '진동': ['없음', '진폭 1.5mm, p-p 10~500Hz, 98.1m/s2, 1사이클 10분, 3방향, 각 2H', '직접입력'],
  '충격': ['없음', '490m/s2, 6ms 톱니파 3방향, 각 3회 (18회)', '직접입력'],
};
const DEFAULT_STANDARDS_STATE = {
  'IP': { option: 'IP65', custom: '' },
  'EMC': { option: 'EN IEC 61000-6-2, 61000-6-4', custom: '' },
  '진동': { option: '진폭 1.5mm, p-p 10~500Hz, 98.1m/s2, 1사이클 10분, 3방향, 각 2H', custom: '' },
  '충격': { option: '490m/s2, 6ms 톱니파 3방향, 각 3회 (18회)', custom: '' }
};

const getTodayKST = () => {
  const now = new Date();
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const kstTime = new Date(utcNow + (9 * 60 * 60 * 1000));
  return kstTime.toISOString().split('T')[0];
};

const calculateDDay = (targetDate) => {
  if (!targetDate) return null;
  const today = new Date(getTodayKST());
  const target = new Date(targetDate);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const DDayBadge = ({ days }) => {
  if (days === null) return <span className="text-gray-400 text-xs">-</span>;
  let colorClass = "bg-gray-100 text-gray-800";
  let text = `D-${days}`;
  if (days < 0) { colorClass = "bg-red-100 text-red-800 font-bold"; text = `D+${Math.abs(days)}`; } 
  else if (days === 0) { colorClass = "bg-orange-500 text-white font-bold"; text = "D-DAY"; } 
  else if (days <= 7) { colorClass = "bg-orange-100 text-orange-800 font-bold"; } 
  else { colorClass = "bg-blue-100 text-blue-800"; }
  return <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ml-2 ${colorClass}`}>{text}</span>;
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  const diffDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? `${diffDays}일` : '-';
};

const isTruthy = (val) => val === true || (typeof val === 'string' && val.trim() !== '');

// -------------------------------------------------------------
// [4] 메인 컴포넌트
// -------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedModels, setExpandedModels] = useState({});
  const [newTestNames, setNewTestNames] = useState({});
  
  const [mainTab, setMainTab] = useState('all'); 
  const [subTab, setSubTab] = useState('TMD');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newModelData, setNewModelData] = useState({ 
    name: '', description: '', division: 'TMD',
    standards: JSON.parse(JSON.stringify(DEFAULT_STANDARDS_STATE))
  });
  const [editModalData, setEditModalData] = useState(null);

  // Firebase 인증
  useEffect(() => {
    signInAnonymously(auth)
      .then(({ user }) => setUser(user))
      .catch(error => { console.error("Auth Error:", error); setLoading(false); });
  }, []);

  // 데이터 불러오기 (Firebase Firestore v10)
  useEffect(() => {
    if (!user) return;
    const modelsRef = collection(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models');
    const unsubscribe = onSnapshot(modelsRef, (snapshot) => {
      const fetchedModels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt - a.createdAt);
      setModels(fetchedModels);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const isTestCompleted = (test) => {
    const baseCompleted = !!(isTruthy(test.draft) && isTruthy(test.quoteReceived) && isTruthy(test.docsSent) && isTruthy(test.reportReceived) && isTruthy(test.invoiceReceived) && isTruthy(test.slipEntered));
    if (test.name === 'IP') return !!(baseCompleted && test.setupDate && test.expectedEndDate && test.setupDateWater && test.expectedEndDateWater);
    return !!(baseCompleted && test.setupDate && test.expectedEndDate);
  };

  // 새 모델 추가
  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!newModelData.name.trim() || !user) return;
    const modelId = `model_${Date.now()}`;
    const initialTests = DEFAULT_TESTS.map(testName => {
      const stdData = newModelData.standards[testName];
      const standardValue = stdData ? (stdData.option === '직접입력' ? stdData.custom : (stdData.option === '없음' ? '' : stdData.option)) : '';
      const testBase = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: testName, standard: standardValue, isFixed: true,
        draft: '', quoteReceived: '', docsSent: '', setupDate: '', expectedEndDate: '', reportReceived: '', invoiceReceived: '', slipEntered: ''
      };
      if (testName === 'IP') { testBase.setupDateWater = ''; testBase.expectedEndDateWater = ''; }
      return testBase;
    });

    const newModel = {
      name: newModelData.name.trim(), description: newModelData.description.trim(), division: newModelData.division,
      tests: initialTests, createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId), newModel);
      setIsAddModalOpen(false);
      setNewModelData({ name: '', description: '', division: subTab || 'TMD', standards: JSON.parse(JSON.stringify(DEFAULT_STANDARDS_STATE)) });
      setExpandedModels(prev => ({ ...prev, [modelId]: true }));
    } catch (error) { console.error("Error:", error); }
  };

  const handleDeleteModel = async (modelId) => {
    if (!user) return;
    if(window.confirm('모델을 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId));
    }
  };

  const handleAddTest = async (modelId, tests) => {
    const testName = newTestNames[modelId];
    if (!testName || !testName.trim() || !user) return;
    const newTest = {
      id: `test_${Date.now()}`, name: testName.trim(), standard: '', isFixed: false,
      draft: '', quoteReceived: '', docsSent: '', setupDate: '', expectedEndDate: '', reportReceived: '', invoiceReceived: '', slipEntered: ''
    };
    await setDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId), { tests: [...tests, newTest] }, { merge: true });
    setNewTestNames(prev => ({ ...prev, [modelId]: '' }));
  };

  const handleDeleteTest = async (modelId, tests, testId) => {
    if (!user) return;
    const updatedTests = tests.filter(test => test.id !== testId);
    await setDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId), { tests: updatedTests }, { merge: true });
  };

  const handleQuickDateSet = async (modelId, tests, testId, field) => {
    if (!user) return;
    const today = getTodayKST();
    const updatedTests = tests.map(test => test.id === testId ? { ...test, [field]: today } : test);
    await setDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId), { tests: updatedTests }, { merge: true });
  };

  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!user || !editModalData) return;
    const { modelId, test: updatedTest } = editModalData;
    const model = models.find(m => m.id === modelId);
    const updatedTests = model.tests.map(t => t.id === updatedTest.id ? updatedTest : t);
    await setDoc(doc(db, 'artifacts', MY_APP_ID, 'users', user.uid, 'reliability_models', modelId), { tests: updatedTests }, { merge: true });
    setEditModalData(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">데이터를 불러오는 중입니다...</div>;

  // 집계 로직
  const totalModelCount = models.length;
  const completedModelCount = models.filter(m => m.tests.length > 0 && m.tests.some(t => isTestCompleted(t))).length;
  const inProgressTestCount = models.reduce((acc, m) => acc + m.tests.filter(t => !isTestCompleted(t)).length, 0);
  const inProgressModelCount = models.filter(m => m.tests.length > 0 && m.tests.some(t => !isTestCompleted(t))).length;

  const displayModels = [];
  models.forEach(model => {
    if (model.division !== subTab) return; 
    const matchingTests = model.tests.filter(test => {
      if (mainTab === 'all') return true;
      return mainTab === 'completed' ? isTestCompleted(test) : !isTestCompleted(test);
    });
    if (matchingTests.length > 0) displayModels.push({ ...model, displayTests: matchingTests });
  });

  const ActionCell = ({ value, onClickQuick, title }) => {
    const isValTruthy = isTruthy(value);
    return (
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
        {isValTruthy ? (
          <span className="text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-md">{value === true ? '완료됨' : value}</span>
        ) : (
          <button onClick={onClickQuick} className="focus:outline-none flex items-center justify-center w-full group" title={`${title} (오늘 날짜로 체크)`}>
            <Square className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </button>
        )}
      </td>
    );
  };

  const TextCell = ({ value, placeholder = "-" }) => (
    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{value || <span className="text-gray-300">{placeholder}</span>}</td>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* 헤더 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4 sm:mb-0">
            <AlertCircle className="text-blue-600 w-6 h-6" /> 신뢰성시험 관리대장
          </h1>
          <button 
            onClick={() => { setNewModelData({ ...newModelData, division: subTab || 'TMD', standards: JSON.parse(JSON.stringify(DEFAULT_STANDARDS_STATE)) }); setIsAddModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> 추가
          </button>
        </div>

        {/* 탭 내비게이션 */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-6 items-start">
            
            {/* 전체 탭 */}
            <div className="relative w-full flex flex-col items-center">
              <button onClick={() => { setMainTab('all'); setSubTab('TMD'); }}
                className={`relative z-10 w-full flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all text-gray-500 
                  ${mainTab === 'all' ? 'border-[#F28DB2] bg-pink-50 shadow-[0_0_15px_rgba(242,141,178,0.5)]' : 'border-[#F28DB2] bg-white hover:bg-pink-50'}`}
              >
                <div className="text-lg font-bold mb-1">전체</div>
                <div className="text-2xl font-extrabold">{totalModelCount} <span className="text-base font-medium">모델</span></div>
              </button>
              {mainTab === 'all' && (
                <div className="w-full pt-6 relative flex justify-between gap-3 z-0 mb-6">
                  <div className="absolute top-0 left-1/2 w-px h-6 bg-[#F28DB2] -translate-x-1/2"></div>
                  <div className="absolute top-6 left-[25%] right-[25%] h-px bg-[#F28DB2]"></div>
                  <button onClick={() => setSubTab('TMD')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'TMD' ? 'border-[#F28DB2] bg-pink-50 shadow-[0_0_10px_rgba(242,141,178,0.4)]' : 'border-[#F28DB2] bg-white hover:bg-pink-50'}`}>TMD</button>
                  <button onClick={() => setSubTab('UHP')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'UHP' ? 'border-[#F28DB2] bg-pink-50 shadow-[0_0_10px_rgba(242,141,178,0.4)]' : 'border-[#F28DB2] bg-white hover:bg-pink-50'}`}>UHP</button>
                </div>
              )}
            </div>

            {/* 진행중 탭 */}
            <div className="relative w-full flex flex-col items-center">
              <button onClick={() => { setMainTab('inProgress'); setSubTab('TMD'); }}
                className={`relative z-10 w-full flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all text-gray-500 
                  ${mainTab === 'inProgress' ? 'border-[#F5AC79] bg-orange-50 shadow-[0_0_15px_rgba(245,172,121,0.5)]' : 'border-[#F5AC79] bg-white hover:bg-orange-50'}`}
              >
                <div className="text-lg font-bold mb-1">진행중</div>
                <div className="text-2xl font-extrabold flex items-baseline justify-center gap-1">
                  {inProgressModelCount} <span className="text-base font-medium">모델</span>
                  <span className="text-lg font-light opacity-40 mx-1">/</span>
                  {inProgressTestCount} <span className="text-base font-medium">시험</span>
                </div>
              </button>
              {mainTab === 'inProgress' && (
                <div className="w-full pt-6 relative flex justify-between gap-3 z-0 mb-6">
                  <div className="absolute top-0 left-1/2 w-px h-6 bg-[#F5AC79] -translate-x-1/2"></div>
                  <div className="absolute top-6 left-[25%] right-[25%] h-px bg-[#F5AC79]"></div>
                  <button onClick={() => setSubTab('TMD')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'TMD' ? 'border-[#F5AC79] bg-orange-50 shadow-[0_0_10px_rgba(245,172,121,0.4)]' : 'border-[#F5AC79] bg-white hover:bg-orange-50'}`}>TMD</button>
                  <button onClick={() => setSubTab('UHP')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'UHP' ? 'border-[#F5AC79] bg-orange-50 shadow-[0_0_10px_rgba(245,172,121,0.4)]' : 'border-[#F5AC79] bg-white hover:bg-orange-50'}`}>UHP</button>
                </div>
              )}
            </div>

            {/* 완료 탭 */}
            <div className="relative w-full flex flex-col items-center">
              <button onClick={() => { setMainTab('completed'); setSubTab('TMD'); }}
                className={`relative z-10 w-full flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all text-gray-500 
                  ${mainTab === 'completed' ? 'border-[#F2CF62] bg-yellow-50 shadow-[0_0_15px_rgba(242,207,98,0.5)]' : 'border-[#F2CF62] bg-white hover:bg-yellow-50'}`}
              >
                <div className="text-lg font-bold mb-1">완료</div>
                <div className="text-2xl font-extrabold">{completedModelCount} <span className="text-base font-medium">모델</span></div>
              </button>
              {mainTab === 'completed' && (
                <div className="w-full pt-6 relative flex justify-between gap-3 z-0 mb-6">
                  <div className="absolute top-0 left-1/2 w-px h-6 bg-[#F2CF62] -translate-x-1/2"></div>
                  <div className="absolute top-6 left-[25%] right-[25%] h-px bg-[#F2CF62]"></div>
                  <button onClick={() => setSubTab('TMD')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'TMD' ? 'border-[#F2CF62] bg-yellow-50 shadow-[0_0_10px_rgba(242,207,98,0.4)]' : 'border-[#F2CF62] bg-white hover:bg-yellow-50'}`}>TMD</button>
                  <button onClick={() => setSubTab('UHP')} className={`w-1/2 mt-0 p-2.5 rounded-lg border-2 text-sm font-bold transition-all z-10 text-gray-500 ${subTab === 'UHP' ? 'border-[#F2CF62] bg-yellow-50 shadow-[0_0_10px_rgba(242,207,98,0.4)]' : 'border-[#F2CF62] bg-white hover:bg-yellow-50'}`}>UHP</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 테이블 목록 */}
        <div className="space-y-6 relative z-10">
          {displayModels.map((model) => (
            <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer border-b border-gray-100 hover:bg-gray-100" onClick={() => setExpandedModels(prev => ({ ...prev, [model.id]: !prev[model.id] }))}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${model.division === 'TMD' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{model.division}</span>
                  <h2 className="text-lg font-bold text-gray-800">{model.name}</h2>
                  {model.description && <span className="text-sm text-gray-500 ml-2">- {model.description}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 className="w-5 h-5" /></button>
                  {expandedModels[model.id] ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </div>

              {expandedModels[model.id] && (
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-4 min-w-[110px] border-b border-gray-200">시험명</th>
                        <th className="px-4 py-4 min-w-[150px] border-b border-gray-200">규격</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">기안작성</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">견적수령</th>
                        <th className="px-4 py-4 min-w-[160px] text-center border-b border-gray-200">견적서 및 신청서 송부</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">셋업일자</th>
                        <th className="px-4 py-4 min-w-[160px] text-center border-b border-gray-200">예상종료일자 (D-Day)</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">성적서수령</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200 bg-indigo-50/50">소요기간</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">계산서수령</th>
                        <th className="px-4 py-4 min-w-[110px] text-center border-b border-gray-200">전표입력</th>
                        <th className="px-4 py-4 min-w-[80px] text-center border-b border-gray-200">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {model.displayTests.map((test) => (
                        <tr key={test.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800 border-r border-gray-50">{test.name}</td>
                          <TextCell value={test.standard} />
                          <ActionCell value={test.draft} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'draft')} title="기안작성" />
                          <ActionCell value={test.quoteReceived} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'quoteReceived')} title="견적수령" />
                          <ActionCell value={test.docsSent} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'docsSent')} title="신청서 송부" />
                          
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {test.name === 'IP' ? (
                              <div className="space-y-1">
                                <div className="flex items-center"><span className="text-xs bg-gray-100 px-1 rounded mr-2 w-8 text-center text-gray-500">방진</span>{test.setupDate || '-'}</div>
                                <div className="flex items-center"><span className="text-xs bg-blue-50 px-1 rounded mr-2 w-8 text-center text-blue-500">방수</span>{test.setupDateWater || '-'}</div>
                              </div>
                            ) : (test.setupDate || '-')}
                          </td>
                          
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {test.name === 'IP' ? (
                              <div className="space-y-1">
                                <div className="flex items-center"><span className="text-xs bg-gray-100 px-1 rounded mr-2 w-8 text-center text-gray-500">방진</span>{test.expectedEndDate || '-'}{test.expectedEndDate && <DDayBadge days={calculateDDay(test.expectedEndDate)} />}</div>
                                <div className="flex items-center"><span className="text-xs bg-blue-50 px-1 rounded mr-2 w-8 text-center text-blue-500">방수</span>{test.expectedEndDateWater || '-'}{test.expectedEndDateWater && <DDayBadge days={calculateDDay(test.expectedEndDateWater)} />}</div>
                              </div>
                            ) : (<div className="flex items-center">{test.expectedEndDate || '-'}{test.expectedEndDate && <DDayBadge days={calculateDDay(test.expectedEndDate)} />}</div>)}
                          </td>

                          <ActionCell value={test.reportReceived} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'reportReceived')} title="성적서수령" />

                          <td className="px-4 py-3 text-center whitespace-nowrap text-sm font-semibold text-indigo-600 bg-indigo-50/30">
                            {test.name === 'IP' ? (
                              <div className="flex flex-col space-y-1 text-xs">
                                <span>방진: {calculateDuration(test.setupDate, test.reportReceived)}</span>
                                <span>방수: {calculateDuration(test.setupDateWater, test.reportReceived)}</span>
                              </div>
                            ) : (calculateDuration(test.setupDate, test.reportReceived))}
                          </td>

                          <ActionCell value={test.invoiceReceived} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'invoiceReceived')} title="계산서수령" />
                          <ActionCell value={test.slipEntered} onClickQuick={() => handleQuickDateSet(model.id, model.tests, test.id, 'slipEntered')} title="전표입력" />
                          
                          <td className="px-4 py-3 text-center whitespace-nowrap border-l border-gray-50">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => setEditModalData({ modelId: model.id, test: { ...test } })} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit className="w-4 h-4" /></button>
                              {!test.isFixed && <button onClick={() => handleDeleteTest(model.id, model.tests, test.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="m-3 flex items-center space-x-2 p-2 bg-gray-50 rounded-lg w-max border border-gray-200">
                    <input type="text" placeholder="새로운 시험 항목 이름" className="text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none w-48" value={newTestNames[model.id] || ''} onChange={(e) => setNewTestNames(prev => ({ ...prev, [model.id]: e.target.value }))} onKeyPress={(e) => { if (e.key === 'Enter') handleAddTest(model.id, model.tests); }} />
                    <button onClick={() => handleAddTest(model.id, model.tests)} className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-md flex items-center"><Plus className="w-4 h-4 mr-1" />추가</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 모달: 새 모델 추가 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex justify-between items-center p-5 border-b border-gray-100 z-10">
              <h2 className="text-xl font-bold text-gray-800">새 모델 추가</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddModel} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업부</label>
                <select value={newModelData.division} onChange={(e) => setNewModelData({ ...newModelData, division: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50">
                  <option value="TMD">TMD</option><option value="UHP">UHP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">모델명 <span className="text-red-500">*</span></label>
                <input type="text" required placeholder="모델명을 입력하세요" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newModelData.name} onChange={(e) => setNewModelData({ ...newModelData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제품 설명</label>
                <input type="text" placeholder="제품에 대한 간단한 설명을 입력하세요" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newModelData.description} onChange={(e) => setNewModelData({ ...newModelData, description: e.target.value })} />
              </div>
              <div className="pt-3">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-4 bg-blue-600 rounded-sm"></div>기본 시험 규격 설정</h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {DEFAULT_TESTS.map(testName => (
                    <div key={testName} className="flex flex-col space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">{testName}</label>
                      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={newModelData.standards[testName].option} onChange={(e) => { const newStandards = { ...newModelData.standards }; newStandards[testName].option = e.target.value; setNewModelData({ ...newModelData, standards: newStandards }); }}>
                        {TEST_STANDARD_OPTIONS[testName].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {newModelData.standards[testName].option === '직접입력' && (
                        <input type="text" required placeholder="규격을 직접 입력하세요" className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 mt-1" value={newModelData.standards[testName].custom} onChange={(e) => { const newStandards = { ...newModelData.standards }; newStandards[testName].custom = e.target.value; setNewModelData({ ...newModelData, standards: newStandards }); }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">취소</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">저장하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 시험 데이터 수정 */}
      {editModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex justify-between items-center p-5 border-b border-gray-100 z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Edit className="w-5 h-5 text-blue-600" />상세 일정 및 데이터 수정</h2>
              <button onClick={() => setEditModalData(null)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveEditModal} className="p-6 space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-blue-900">시험명: {editModalData.test.name}</span>
                {!editModalData.test.isFixed && <input type="text" value={editModalData.test.name} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, name: e.target.value } })} className="ml-4 text-sm px-2 py-1 border border-blue-200 rounded" placeholder="시험명 수정" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">규격 (Standard)</label>
                <input type="text" placeholder="예: IEC 60529" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 outline-none" value={editModalData.test.standard || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, standard: e.target.value } })} />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">기안작성일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm" value={editModalData.test.draft || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, draft: e.target.value } })} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">견적수령일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm" value={editModalData.test.quoteReceived || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, quoteReceived: e.target.value } })} /></div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">신청서 송부일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm" value={editModalData.test.docsSent || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, docsSent: e.target.value } })} /></div>
              </div>
              {editModalData.test.name === 'IP' ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"></div> 방진 (Dust)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">셋업일자</label><input type="date" className="w-full px-2 py-1.5 border rounded-md text-sm" value={editModalData.test.setupDate || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, setupDate: e.target.value } })} /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">예상종료일</label><input type="date" className="w-full px-2 py-1.5 border rounded-md text-sm" value={editModalData.test.expectedEndDate || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, expectedEndDate: e.target.value } })} /></div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 방수 (Water)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">셋업일자</label><input type="date" className="w-full px-2 py-1.5 border rounded-md text-sm" value={editModalData.test.setupDateWater || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, setupDateWater: e.target.value } })} /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">예상종료일</label><input type="date" className="w-full px-2 py-1.5 border rounded-md text-sm" value={editModalData.test.expectedEndDateWater || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, expectedEndDateWater: e.target.value } })} /></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">셋업일자</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm bg-gray-50" value={editModalData.test.setupDate || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, setupDate: e.target.value } })} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">예상종료일 (D-Day)</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm bg-gray-50" value={editModalData.test.expectedEndDate || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, expectedEndDate: e.target.value } })} /></div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                <div><label className="block text-xs font-semibold text-indigo-700 mb-1">성적서수령일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm border-indigo-200 bg-indigo-50" value={editModalData.test.reportReceived || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, reportReceived: e.target.value } })} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">계산서수령일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm" value={editModalData.test.invoiceReceived || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, invoiceReceived: e.target.value } })} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">전표입력일</label><input type="date" className="w-full px-3 py-1.5 border rounded-md text-sm" value={editModalData.test.slipEntered || ''} onChange={(e) => setEditModalData({ ...editModalData, test: { ...editModalData.test, slipEntered: e.target.value } })} /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditModalData(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">취소</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">변경사항 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}