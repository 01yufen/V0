import React, { useState, useEffect } from 'react';
import { Calendar, Settings, ListTodo, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Circle, Home, CalendarDays, Check } from 'lucide-react';

// 取得指定日期所在星期的週一 (將時間歸零以避免時區誤差)
const getMonday = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// 格式化日期為 YYYY-MM-DD 作為資料的 Key
const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 日期加減
const addDays = (d, days) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

// 顯示用的短日期 (MM/DD)
const formatDisplayDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;

export default function App() {
  // 導覽狀態：'home' (主頁), 'daily' (每日排程), 'settings' (設定)
  const [activeTab, setActiveTab] = useState('home');
  // 設定頁面的子步驟：1 (主題), 2 (單元模板)
  const [settingStep, setSettingStep] = useState(1);
  
  // 日期管理狀態
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0-6 (週一至週日)
  
  // 核心資料狀態
  const [topics, setTopics] = useState([
    { id: '1', name: '專案A開發', color: 'bg-blue-200', targetUnits: 10 },
    { id: '2', name: '會議與溝通', color: 'bg-green-200', targetUnits: 5 },
    { id: '3', name: '學習與研究', color: 'bg-purple-200', targetUnits: 3 },
    { id: '4', name: '行政事務', color: 'bg-yellow-200', targetUnits: 2 }
  ]);
  
  // 每週單元模板安排 (7天 x 6單元) - 結構: { dayIndex: { unitIndex: topicId } }
  const [schedule, setSchedule] = useState({});
  
  // 單元細項與完成狀態 (綁定真實日期) - 結構: { 'YYYY-MM-DD-unitIndex': { tasks: [{ id, text, completed }] } }
  const [unitDetails, setUnitDetails] = useState({});
  
  // 目前選取的單元，用於每日排程顯示詳細內容對話框
  const [selectedUnit, setSelectedUnit] = useState(null);

  const colorOptions = [
    'bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 
    'bg-blue-200', 'bg-indigo-200', 'bg-purple-200'
  ];

  const daysOfWeek = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const unitNames = ['單元 1 (早晨)', '單元 2 (上午)', '單元 3 (中午)', '單元 4 (下午)', '單元 5 (傍晚)', '單元 6 (晚上)'];

  const handleAddTopic = () => {
    const newTopic = {
      id: Date.now().toString(),
      name: '新主題',
      color: colorOptions[topics.length % colorOptions.length],
      targetUnits: 1
    };
    setTopics([...topics, newTopic]);
  };

  const handleUpdateTopic = (id, field, value) => {
    setTopics(topics.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDeleteTopic = (id) => {
    setTopics(topics.filter(t => t.id !== id));
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(day => {
      Object.keys(newSchedule[day]).forEach(unit => {
        if (newSchedule[day][unit] === id) {
          delete newSchedule[day][unit];
        }
      });
    });
    setSchedule(newSchedule);
  };

  const handleAssignUnit = (dayIndex, unitIndex, topicId) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      if (!newSchedule[dayIndex]) newSchedule[dayIndex] = {};
      if (topicId) {
        newSchedule[dayIndex][unitIndex] = topicId;
      } else {
        delete newSchedule[dayIndex][unitIndex];
      }
      return newSchedule;
    });
  };

  // 根據日期字串新增任務
  const handleAddTask = (dateStr, unitIndex, taskText) => {
    if (!taskText.trim()) return;
    const unitKey = `${dateStr}-${unitIndex}`;
    setUnitDetails(prev => {
      const currentUnit = prev[unitKey] || { tasks: [] };
      return {
        ...prev,
        [unitKey]: {
          tasks: [...currentUnit.tasks, { id: Date.now().toString(), text: taskText, completed: false }]
        }
      };
    });
  };

  const handleToggleTask = (dateStr, unitIndex, taskId) => {
    const unitKey = `${dateStr}-${unitIndex}`;
    setUnitDetails(prev => {
      if (!prev[unitKey]) return prev;
      return {
        ...prev,
        [unitKey]: {
          tasks: prev[unitKey].tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        }
      };
    });
  };

  const handleDeleteTask = (dateStr, unitIndex, taskId) => {
    const unitKey = `${dateStr}-${unitIndex}`;
    setUnitDetails(prev => {
      if (!prev[unitKey]) return prev;
      return {
        ...prev,
        [unitKey]: {
          tasks: prev[unitKey].tasks.filter(t => t.id !== taskId)
        }
      };
    });
  };

  const getTopic = (topicId) => topics.find(t => t.id === topicId) || null;

  // 跳轉到特定日期的詳細畫面
  const goToDailyView = (dayIndex, unitIndex, topic) => {
    setCurrentDayIndex(dayIndex);
    setActiveTab('daily');
    if (topic) {
      setSelectedUnit({ dayIndex, unitIndex, topic });
    } else {
      setSelectedUnit(null);
    }
  };

  // 取得當週的7天Date物件
  const weekDates = Array.from({length: 7}, (_, i) => addDays(currentWeekStart, i));
  const weekEndDate = addDays(currentWeekStart, 6);

  const renderHome = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 頂部週數切換 */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">本週進度概覽</h2>
            <p className="text-slate-500 text-sm">綜覽全週工作，掌握每個時段的達成率</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <button 
            onClick={() => {
              setCurrentWeekStart(prev => addDays(prev, -7));
              setSelectedUnit(null);
            }}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="font-semibold text-slate-700 min-w-[140px] text-center">
            {currentWeekStart.getFullYear()}年 {formatDisplayDate(currentWeekStart)} - {formatDisplayDate(weekEndDate)}
          </div>
          <button 
            onClick={() => {
              setCurrentWeekStart(prev => addDays(prev, 7));
              setSelectedUnit(null);
            }}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* 7天網格檢視 */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDates.map((date, dayIndex) => {
          const dateStr = formatDate(date);
          const isToday = formatDate(new Date()) === dateStr;
          
          return (
            <div key={dateStr} className={`bg-white rounded-2xl shadow-sm border ${isToday ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'} overflow-hidden flex flex-col`}>
              {/* 日期標頭 */}
              <div className={`p-3 text-center border-b ${isToday ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>{daysOfWeek[dayIndex]}</div>
                <div className={`text-xl font-black mt-0.5 ${isToday ? 'text-indigo-700' : 'text-slate-800'}`}>{formatDisplayDate(date)}</div>
              </div>
              
              {/* 6個單元區塊 */}
              <div className="p-3 space-y-2 flex-1">
                {unitNames.map((unitName, unitIndex) => {
                  const topicId = schedule[dayIndex]?.[unitIndex];
                  const topic = topicId ? getTopic(topicId) : null;
                  const tasks = unitDetails[`${dateStr}-${unitIndex}`]?.tasks || [];
                  const totalTasks = tasks.length;
                  const completedTasks = tasks.filter(t => t.completed).length;
                  const hasTasks = totalTasks > 0;
                  const isAllCompleted = hasTasks && totalTasks === completedTasks;
                  
                  return (
                    <div 
                      key={unitIndex}
                      onClick={() => goToDailyView(dayIndex, unitIndex, topic)}
                      className={`relative p-2.5 rounded-xl border transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-md
                        ${topic ? `${topic.color} border-transparent` : 'bg-slate-50 border-dashed border-slate-200 hover:border-indigo-300'}
                        ${isAllCompleted ? 'opacity-80' : ''}
                      `}
                    >
                      {/* 單元名稱提示 */}
                      <div className="text-[10px] text-slate-500/70 font-semibold mb-1 uppercase tracking-wider">{unitName.split(' ')[0]}</div>
                      
                      {topic ? (
                        <div className="flex flex-col h-full justify-between">
                          <div className="font-bold text-sm text-slate-800 leading-tight mb-2 pr-4">{topic.name}</div>
                          
                          {/* 進度與狀態標示 */}
                          <div className="flex items-center justify-between mt-auto">
                            {hasTasks ? (
                              isAllCompleted ? (
                                <div className="flex items-center gap-1 text-green-700 bg-white/60 px-1.5 py-0.5 rounded text-xs font-bold w-fit">
                                  <Check className="w-3 h-3" /> 完成
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 w-full">
                                  <div className="flex-1 bg-white/40 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-slate-700 h-full rounded-full" style={{ width: `${(completedTasks/totalTasks)*100}%`}}></div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-700">{completedTasks}/{totalTasks}</span>
                                </div>
                              )
                            ) : (
                              <div className="text-[10px] text-slate-600/70 bg-white/40 px-1.5 py-0.5 rounded font-medium">尚未新增任務</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center py-2">
                          <span className="text-xs text-slate-400 font-medium">未安排</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDaily = () => {
    const currentDate = weekDates[currentDayIndex];
    const currentDateStr = formatDate(currentDate);

    return (
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 relative">
        {/* 左側：當日行事曆主體 */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (currentDayIndex > 0) setCurrentDayIndex(prev => prev - 1);
                  else {
                    setCurrentWeekStart(prev => addDays(prev, -7));
                    setCurrentDayIndex(6);
                  }
                  setSelectedUnit(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
              
              <div className="text-center min-w-[160px]">
                <h2 className="text-2xl font-black text-slate-800">{formatDisplayDate(currentDate)} ({daysOfWeek[currentDayIndex]})</h2>
                <p className="text-slate-500 text-sm mt-1">{currentWeekStart.getFullYear()}年</p>
              </div>
              
              <button 
                onClick={() => {
                  if (currentDayIndex < 6) setCurrentDayIndex(prev => prev + 1);
                  else {
                    setCurrentWeekStart(prev => addDays(prev, 7));
                    setCurrentDayIndex(0);
                  }
                  setSelectedUnit(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <button 
              onClick={() => {
                setActiveTab('settings');
                setSettingStep(2);
              }}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              <Settings className="w-4 h-4" /> 編輯每週模板
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unitNames.map((unitName, unitIndex) => {
              const topicId = schedule[currentDayIndex]?.[unitIndex];
              const topic = topicId ? getTopic(topicId) : null;
              const unitKey = `${currentDateStr}-${unitIndex}`;
              const tasks = unitDetails[unitKey]?.tasks || [];
              const completedCount = tasks.filter(t => t.completed).length;
              const progress = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;
              const isSelected = selectedUnit?.dayIndex === currentDayIndex && selectedUnit?.unitIndex === unitIndex;
              
              return (
                <div 
                  key={unitIndex} 
                  onClick={() => topic && setSelectedUnit({ dayIndex: currentDayIndex, unitIndex, topic })}
                  className={`rounded-xl border p-5 transition-all relative overflow-hidden bg-white
                    ${topic ? 'cursor-pointer hover:shadow-md' : 'border-dashed border-slate-200 opacity-60'}
                    ${isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-md' : topic ? 'border-slate-200 hover:border-indigo-300' : ''}
                  `}
                >
                  {topic && (
                    <div className={`absolute top-0 left-0 w-2 h-full ${topic.color}`}></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3 pl-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500">{unitName}</h3>
                      {topic ? (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${topic.color}`}></span>
                          <span className="font-bold text-lg text-slate-800">{topic.name}</span>
                        </div>
                      ) : (
                        <div className="mt-1 font-medium text-slate-400 italic">未安排主題 (請至設定修改模板)</div>
                      )}
                    </div>
                    
                    {topic && tasks.length > 0 && (
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${completedCount === tasks.length ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {completedCount}/{tasks.length}
                      </div>
                    )}
                  </div>

                  {topic && (
                    <div>
                      {tasks.length > 0 ? (
                        <div className="pl-3 mt-4 space-y-2">
                          {tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              {task.completed ? 
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : 
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              }
                              <span className={`truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                          {tasks.length > 3 && (
                            <div className="text-xs text-slate-400 pl-6 font-medium">還有 {tasks.length - 3} 個細項...</div>
                          )}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                            <div className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="pl-3 mt-4 flex items-center gap-2 text-sm text-slate-400 font-medium">
                          <ListTodo className="w-4 h-4" /> 點擊以新增工作細項
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側：選定單元的詳細任務面板 */}
        <div className={`w-full lg:w-1/3 ${selectedUnit && selectedUnit.dayIndex === currentDayIndex ? 'block' : 'hidden lg:block lg:opacity-50 lg:pointer-events-none'}`}>
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-full min-h-[500px] flex flex-col sticky top-6">
            {selectedUnit && selectedUnit.dayIndex === currentDayIndex ? (
              <>
                <div className={`p-5 border-b border-slate-200 ${selectedUnit.topic.color} bg-opacity-30`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 mb-1">
                        {formatDisplayDate(currentDate)} • {unitNames[selectedUnit.unitIndex]}
                      </h3>
                      <h2 className="text-xl font-bold text-slate-900">{selectedUnit.topic.name}</h2>
                    </div>
                    <button onClick={() => setSelectedUnit(null)} className="lg:hidden p-1.5 bg-white/50 hover:bg-white/80 rounded-md transition-colors">
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 overflow-y-auto bg-slate-50">
                  <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-500" /> 單元工作細項
                  </h4>
                  
                  <div className="space-y-3">
                    {(unitDetails[`${currentDateStr}-${selectedUnit.unitIndex}`]?.tasks || []).map(task => (
                      <div 
                        key={task.id} 
                        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${task.completed ? 'bg-slate-100/50 border-slate-200' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'}`}
                      >
                        <button 
                          onClick={() => handleToggleTask(currentDateStr, selectedUnit.unitIndex, task.id)}
                          className="mt-0.5 shrink-0 transition-transform active:scale-90"
                        >
                          {task.completed ? 
                            <CheckCircle2 className="w-5 h-5 text-green-500 hover:text-green-600" /> : 
                            <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400" />
                          }
                        </button>
                        <span className={`flex-1 text-sm pt-0.5 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                          {task.text}
                        </span>
                        <button 
                          onClick={() => handleDeleteTask(currentDateStr, selectedUnit.unitIndex, task.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {(!unitDetails[`${currentDateStr}-${selectedUnit.unitIndex}`]?.tasks || unitDetails[`${currentDateStr}-${selectedUnit.unitIndex}`].tasks.length === 0) && (
                      <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-xl">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ListTodo className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">尚未新增任何工作細項</p>
                        <p className="text-slate-400 text-xs mt-1">在下方輸入框新增您的任務</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements.taskInput;
                      handleAddTask(currentDateStr, selectedUnit.unitIndex, input.value);
                      input.value = '';
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      name="taskInput"
                      type="text" 
                      placeholder="輸入新任務並按 Enter..." 
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
                      autoComplete="off"
                    />
                    <button 
                      type="submit"
                      className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0 shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                  <Calendar className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">選擇一個單元</h3>
                <p className="text-slate-500 text-sm max-w-[200px]">點擊左側行事曆中有安排主題的單元，即可在此管理詳細任務。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 設定頁面內部導覽 */}
      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setSettingStep(1)}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${settingStep === 1 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          1. 設定工作主題
        </button>
        <button 
          onClick={() => setSettingStep(2)}
          className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors ${settingStep === 2 ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          2. 安排每週模板
        </button>
      </div>

      {settingStep === 1 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">自訂工作主題與目標</h2>
            <p className="text-slate-500 text-sm mt-1">設定您每週想要專注的領域，並分配預期的單元數量。</p>
          </div>
          
          <div className="p-6 space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex-1 w-full">
                  <label className="text-xs text-slate-500 font-bold mb-1.5 block uppercase tracking-wider">主題名稱</label>
                  <input 
                    type="text" 
                    value={topic.name} 
                    onChange={(e) => handleUpdateTopic(topic.id, 'name', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
                
                <div className="w-full sm:w-32">
                  <label className="text-xs text-slate-500 font-bold mb-1.5 block uppercase tracking-wider">目標單元數</label>
                  <input 
                    type="number" 
                    min="1" max="42"
                    value={topic.targetUnits} 
                    onChange={(e) => handleUpdateTopic(topic.id, 'targetUnits', parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
                  />
                </div>
                
                <div className="w-full sm:w-auto">
                  <label className="text-xs text-slate-500 font-bold mb-1.5 block uppercase tracking-wider">標籤顏色</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => handleUpdateTopic(topic.id, 'color', color)}
                        className={`w-9 h-9 rounded-full ${color} border-2 ${topic.color === color ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'} hover:scale-110 transition-all`}
                      />
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="p-2.5 mt-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <button 
              onClick={handleAddTopic}
              className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新增工作主題
            </button>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={() => setSettingStep(2)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              前往安排模板
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">預設每週模板</h2>
              <p className="text-slate-500 text-sm mt-1">此模板將套用至每日排程中，作為每週的固定規劃。</p>
            </div>
            <button 
              onClick={() => setActiveTab('home')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              完成設定
            </button>
          </div>

          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-left font-bold text-slate-500 w-28">時間段</th>
                {daysOfWeek.map((day, i) => (
                  <th key={day} className="p-4 font-bold text-center text-slate-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitNames.map((unitName, unitIndex) => (
                <tr key={unitIndex} className="hover:bg-slate-50/30">
                  <td className="p-4 text-sm font-bold text-slate-500 border-r border-slate-100 align-middle">
                    <div className="text-center text-slate-700">{unitName.split(' ')[0]}</div>
                    <div className="text-center text-xs text-slate-400 font-medium mt-1">{unitName.split(' ')[1]}</div>
                  </td>
                  {daysOfWeek.map((_, dayIndex) => {
                    const assignedTopicId = schedule[dayIndex]?.[unitIndex];
                    const topic = assignedTopicId ? getTopic(assignedTopicId) : null;
                    return (
                      <td key={dayIndex} className="p-2 border-r border-slate-100 last:border-0 relative">
                        <select
                          value={assignedTopicId || ''}
                          onChange={(e) => handleAssignUnit(dayIndex, unitIndex, e.target.value)}
                          className={`w-full h-16 p-2 rounded-xl border outline-none appearance-none cursor-pointer transition-all text-sm ${
                            topic ? `${topic.color} border-transparent text-slate-800 font-bold shadow-sm` : 'bg-slate-50 border-slate-200 text-slate-400 font-medium hover:border-indigo-300'
                          }`}
                        >
                          <option value="">-- 空白 --</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans pb-20">
      {/* 頂部全域導覽列 */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 hidden sm:block">FocusWeek</h1>
          </div>
          
          <nav className="flex gap-1 sm:gap-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'home' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Home className="w-4 h-4" /> <span className="hidden sm:inline">主頁概覽</span>
            </button>
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'daily' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">每日任務</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4" /> <span className="hidden sm:inline">排程設定</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 主要內容區，根據標籤動態渲染 */}
      <main className="px-4 pt-6">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'daily' && renderDaily()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
}