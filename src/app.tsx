import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Settings,
  LayoutDashboard,
  CalendarDays,
  X,
} from 'lucide-react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue !== null ? JSON.parse(savedValue) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('寫入儲存資料失敗:', error);
    }
  }, [key, value]);

  return [value, setValue];
}

const COLORS = [
  { name: '紅', value: 'bg-red-500' },
  { name: '橘', value: 'bg-orange-500' },
  { name: '黃', value: 'bg-yellow-500' },
  { name: '綠', value: 'bg-green-500' },
  { name: '藍', value: 'bg-blue-500' },
  { name: '紫', value: 'bg-purple-500' },
  { name: '灰', value: 'bg-gray-500' },
];

export default function App() {
  const [topics, setTopics] = useLocalStorage('app_topics', []);
  const [schedule, setSchedule] = useLocalStorage('app_schedule', {});
  const [tasks, setTasks] = useLocalStorage('app_tasks', {});

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null);

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicTarget, setNewTopicTarget] = useState(1);
  const [newTopicColor, setNewTopicColor] = useState(COLORS[0].value);
  const [newTaskText, setNewTaskText] = useState('');

  const getWeekDates = (date) => {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);
  const days = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
  const units = ['單元 1', '單元 2', '單元 3', '單元 4', '單元 5', '單元 6'];

  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const changeWeek = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentDate(newDate);
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      setTopics([
        ...topics,
        {
          id: Date.now().toString(),
          name: newTopicName,
          target: newTopicTarget,
          color: newTopicColor,
        },
      ]);
      setNewTopicName('');
      setNewTopicTarget(1);
    }
  };

  const handleDeleteTopic = (id) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  const handleAssignTopic = (dateKey, unitIndex, topicId) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[dateKey]) newSchedule[dateKey] = Array(6).fill(null);
    newSchedule[dateKey][unitIndex] = topicId;
    setSchedule(newSchedule);
  };

  const handleAddTask = (dateKey, unitIndex) => {
    if (!newTaskText.trim()) return;
    const taskKey = `${dateKey}-${unitIndex}`;
    const currentTasks = tasks[taskKey] || [];
    setTasks({
      ...tasks,
      [taskKey]: [
        ...currentTasks,
        { id: Date.now().toString(), text: newTaskText, completed: false },
      ],
    });
    setNewTaskText('');
  };

  const toggleTask = (dateKey, unitIndex, taskId) => {
    const taskKey = `${dateKey}-${unitIndex}`;
    const updatedTasks = tasks[taskKey].map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks({ ...tasks, [taskKey]: updatedTasks });
  };

  const deleteTask = (dateKey, unitIndex, taskId) => {
    const taskKey = `${dateKey}-${unitIndex}`;
    const updatedTasks = tasks[taskKey].filter((t) => t.id !== taskId);
    setTasks({ ...tasks, [taskKey]: updatedTasks });
  };

  const getTopicDetails = (topicId) => {
    return topics.find((t) => t.id === topicId) || null;
  };

  // 計算總單元數與剩餘數量
  const totalTargetUnits = topics.reduce((sum, topic) => sum + topic.target, 0);
  const remainingUnits = 42 - totalTargetUnits;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className="bg-white shadow-sm px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-500" />
          工作進度管理
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              activeTab === 'dashboard'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={18} /> 主頁概覽
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              activeTab === 'calendar'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <CalendarDays size={18} /> 每日排程
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              activeTab === 'settings'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Settings size={18} /> 主題設定
          </button>
        </div>
      </nav>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">
              設定本週主題與目標單元數
            </h2>

            {/* 新增：統計與剩餘單元數計算區塊 */}
            <div className="flex flex-wrap gap-6 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">一週總單元數</span>
                <span className="text-xl font-bold text-gray-700">42</span>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">已分配單元</span>
                <span className="text-xl font-bold text-blue-600">
                  {totalTargetUnits}
                </span>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">剩餘可用單元</span>
                <span
                  className={`text-xl font-bold ${
                    remainingUnits < 0 ? 'text-red-500' : 'text-green-600'
                  }`}
                >
                  {remainingUnits}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <input
                type="text"
                placeholder="主題名稱 (例: 開發 App)"
                className="border p-2 rounded flex-1 min-w-[200px]"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">目標單元:</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, remainingUnits)}
                  className="border p-2 rounded w-20"
                  value={newTopicTarget}
                  onChange={(e) => setNewTopicTarget(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewTopicColor(c.value)}
                    className={`w-6 h-6 rounded-full ${c.value} ${
                      newTopicColor === c.value
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                onClick={handleAddTopic}
                disabled={remainingUnits <= 0}
                className={`px-4 py-2 rounded flex items-center gap-1 text-white ${
                  remainingUnits <= 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                <Plus size={18} /> 新增
              </button>
            </div>

            <ul className="space-y-3">
              {topics.map((topic) => (
                <li
                  key={topic.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded border"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full ${topic.color}`}
                    ></span>
                    <span className="font-medium">{topic.name}</span>
                    <span className="text-sm text-gray-500">
                      目標: {topic.target} 單元
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
              {topics.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  尚未設定任何主題
                </p>
              )}
            </ul>
          </div>
        )}

        {(activeTab === 'dashboard' || activeTab === 'calendar') && (
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
            <button
              onClick={() => changeWeek(-1)}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              上一週
            </button>
            <h2 className="text-lg font-bold">
              {weekDates[0].toLocaleDateString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
              })}{' '}
              -{' '}
              {weekDates[6].toLocaleDateString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
              })}
            </h2>
            <button
              onClick={() => changeWeek(1)}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              下一週
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-2 font-medium text-gray-600 text-center">
                <div>單元 / 日期</div>
                {weekDates.map((date, i) => (
                  <div key={i}>
                    {days[i]}{' '}
                    <div className="text-xs text-gray-400">
                      {date.getDate()}日
                    </div>
                  </div>
                ))}
              </div>
              {units.map((unit, unitIndex) => (
                <div
                  key={unitIndex}
                  className="grid grid-cols-8 gap-2 mb-2 items-center"
                >
                  <div className="text-center text-sm font-medium text-gray-500">
                    {unit}
                  </div>
                  {weekDates.map((date, dayIndex) => {
                    const dateKey = formatDateKey(date);
                    const topicId = schedule[dateKey]?.[unitIndex];
                    const topic = getTopicDetails(topicId);
                    const unitTasks = tasks[`${dateKey}-${unitIndex}`] || [];
                    const completedTasks = unitTasks.filter(
                      (t) => t.completed
                    ).length;
                    const totalTasks = unitTasks.length;

                    return (
                      <div
                        key={dayIndex}
                        className={`h-16 rounded border flex flex-col justify-center items-center p-1 text-xs ${
                          topic
                            ? topic.color + ' text-white bg-opacity-90'
                            : 'bg-gray-50'
                        }`}
                      >
                        {topic ? (
                          <>
                            <span className="font-bold truncate w-full text-center">
                              {topic.name}
                            </span>
                            {totalTasks > 0 && (
                              <span className="mt-1 bg-white/20 px-2 rounded-full">
                                {completedTasks}/{totalTasks} 完成
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
              {weekDates.map((date, dayIndex) => {
                const dateKey = formatDateKey(date);
                return (
                  <div
                    key={dateKey}
                    className="bg-white border rounded-lg overflow-hidden shadow-sm"
                  >
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                      <span className="font-bold text-gray-700">
                        {days[dayIndex]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {date.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-0">
                      {units.map((unit, unitIndex) => {
                        const topicId = schedule[dateKey]?.[unitIndex];
                        const topic = getTopicDetails(topicId);
                        const isSelected =
                          selectedCell?.dateKey === dateKey &&
                          selectedCell?.unitIndex === unitIndex;

                        return (
                          <div
                            key={unitIndex}
                            onClick={() =>
                              setSelectedCell({ dateKey, unitIndex })
                            }
                            className={`p-3 border-r border-b cursor-pointer transition-colors min-h-[100px] flex flex-col ${
                              isSelected
                                ? 'ring-2 ring-blue-500 ring-inset bg-blue-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-xs text-gray-400 mb-1">
                              {unit}
                            </span>
                            <select
                              className={`w-full text-sm p-1 rounded border mb-2 ${
                                topic ? topic.color + ' text-white' : 'bg-white'
                              }`}
                              value={topicId || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleAssignTopic(
                                  dateKey,
                                  unitIndex,
                                  e.target.value
                                );
                              }}
                            >
                              <option value="">-- 空白 --</option>
                              {topics.map((t) => (
                                <option
                                  key={t.id}
                                  value={t.id}
                                  className="bg-white text-gray-800"
                                >
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {topic && (
                              <div className="text-xs text-gray-500 mt-auto flex items-center justify-between">
                                任務數:{' '}
                                {
                                  (tasks[`${dateKey}-${unitIndex}`] || [])
                                    .length
                                }
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

            {selectedCell && (
              <div className="w-full lg:w-80 bg-white border rounded-lg shadow-sm p-4 h-fit sticky top-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold">
                    {new Date(selectedCell.dateKey).toLocaleDateString()} - 單元{' '}
                    {selectedCell.unitIndex + 1}
                  </h3>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="新增待辦細項..."
                      className="border p-2 rounded flex-1 text-sm"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        handleAddTask(
                          selectedCell.dateKey,
                          selectedCell.unitIndex
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        handleAddTask(
                          selectedCell.dateKey,
                          selectedCell.unitIndex
                        )
                      }
                      className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
                    >
                      新增
                    </button>
                  </div>
                </div>

                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {(
                    tasks[
                      `${selectedCell.dateKey}-${selectedCell.unitIndex}`
                    ] || []
                  ).map((task) => (
                    <li
                      key={task.id}
                      className="flex gap-2 items-start p-2 hover:bg-gray-50 rounded group"
                    >
                      <button
                        onClick={() =>
                          toggleTask(
                            selectedCell.dateKey,
                            selectedCell.unitIndex,
                            task.id
                          )
                        }
                        className="mt-1 text-gray-400 hover:text-blue-500"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="text-green-500" size={18} />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          task.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-700'
                        }`}
                      >
                        {task.text}
                      </span>
                      <button
                        onClick={() =>
                          deleteTask(
                            selectedCell.dateKey,
                            selectedCell.unitIndex,
                            task.id
                          )
                        }
                        className="text-red-400 opacity-0 group-hover:opacity-100 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                  {(
                    tasks[
                      `${selectedCell.dateKey}-${selectedCell.unitIndex}`
                    ] || []
                  ).length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">
                      此單元尚未新增待辦細項
                    </p>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
