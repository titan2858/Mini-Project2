import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, Loader2, Trophy, Terminal, Code2, XCircle, ArrowLeft, CheckCircle2, 
  AlertCircle, Clock, Swords, Timer, Sparkles, BrainCircuit, X, AlertTriangle
} from 'lucide-react';
import { socket } from '../utils/socket';
import api, { analyzeCode } from '../utils/api';

const Arena = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [searchParams] = useSearchParams();
  
  // Game State
  const [status, setStatus] = useState('waiting'); 
  const [countdownTimer, setCountdownTimer] = useState(0); 
  const [gameTimer, setGameTimer] = useState(0); 
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Waiting for game to start...');
  
  // UI State
  const [activeTab, setActiveTab] = useState('description');
  const [consoleTab, setConsoleTab] = useState('testcase');
  const [activeTestCaseId, setActiveTestCaseId] = useState(0);
  
  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null); 
  const [submitResult, setSubmitResult] = useState(null); 
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Anti-Cheat State
  const [strikes, setStrikes] = useState(0);

  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null);

  useEffect(() => {
    let username = 'Guest';
    let userId = 'guest';

    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            username = u.username || u.name || (u.email ? u.email.split('@')[0] : 'Guest');
            userId = u._id || u.id || 'guest';
        }
        
        const storedName = localStorage.getItem('username');
        if(storedName) username = storedName;
        
        const storedId = localStorage.getItem('userId');
        if(storedId) userId = storedId;

    } catch(e) { }

    const joinRoom = () => {
        const cleanRoomId = roomId.trim(); 
        socket.emit('join_room', { roomId: cleanRoomId, username, userId });
    };

    if (!socket.connected) {
        socket.connect();
    } else {
        joinRoom();
    }

    socket.on('connect', joinRoom);

    const handleMatchFound = (data) => {
        setStatus('starting');
        setCountdownTimer(Math.ceil(data.duration / 1000));
    };

    const handleGameStart = (data) => {
      setStatus('playing');
      setProblem(data.problem);
      
      const durationMs = data.gameDuration || (30 * 60 * 1000);
      setGameTimer(Math.ceil(durationMs / 1000));

      if (data.problem.starterCode && data.problem.starterCode['javascript']) {
        setCode(data.problem.starterCode['javascript']);
      } else {
        setCode('// Write your code here...');
      }
    };

    const handleOpponentProgress = (data) => {
        setOpponentProgress(data.progress);
    };

    const handleGameOver = (data) => {
        setStatus('finished');
        setWinner(data.winnerId);
        setWinReason(data.reason); 
    };

    const handleError = (data) => {
        if (data.message.includes("Room is full")) {
             alert("Room is full! Redirecting...");
             navigate('/dashboard');
        }
    };

    socket.on('match_found', handleMatchFound);
    socket.on('game_start', handleGameStart);
    socket.on('opponent_progress', handleOpponentProgress);
    socket.on('game_over', handleGameOver);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('match_found', handleMatchFound);
      socket.off('game_start', handleGameStart);
      socket.off('opponent_progress', handleOpponentProgress);
      socket.off('game_over', handleGameOver);
      socket.off('error', handleError);
      socket.disconnect();
    };
  }, [roomId, navigate]);

  useEffect(() => {
      let interval;
      if (status === 'starting' && countdownTimer > 0) {
          interval = setInterval(() => {
              setCountdownTimer((prev) => prev - 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [status, countdownTimer]);

  useEffect(() => {
      let interval;
      if (status === 'playing' && gameTimer > 0) {
          interval = setInterval(() => {
              setGameTimer((prev) => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [status, gameTimer]); 

  // --- ANTI-CHEAT (TAB SWITCH) ---
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.hidden && status === 'playing') {
              setStrikes(prev => {
                  const newStrikes = prev + 1;
                  
                  if (newStrikes >= 3) {
                      setStatus('finished');
                      setWinReason('disqualified');
                      setWinner('opponent');
                      socket.emit('player_disqualified', { roomId });
                  } else {
                      alert(`⚠️ ANTI-CHEAT WARNING!\n\nTab switching is not allowed during battle.\nStrike ${newStrikes}/3.\n\nAt 3 strikes you will be disqualified.`);
                  }
                  return newStrikes;
              });
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, roomId]);

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  const handleLanguageChange = (e) => {
      const newLang = e.target.value;
      setLanguage(newLang);
      if (problem?.starterCode?.[newLang]) {
          setCode(problem.starterCode[newLang]);
      }
  };

  // --- ANTI-CHEAT (DISABLE PASTE) ---
  const handleEditorDidMount = (editor, monaco) => {
      // 1. Block Right-Click Paste / Standard Paste Event
      const domNode = editor.getContainerDomNode();
      domNode.addEventListener('paste', (e) => {
          e.preventDefault();
          e.stopPropagation();
          alert("⚠️ Anti-Cheat: Copy-Pasting is disabled in the Arena!");
      }, true); 

      // 2. Block Keyboard Shortcuts (Ctrl+V / Cmd+V)
      editor.onKeyDown((e) => {
          const { keyCode, ctrlKey, metaKey } = e;
          // 52 is the KeyCode for 'V' in Monaco
          if ((ctrlKey || metaKey) && keyCode === 52) {
              e.preventDefault();
              e.stopPropagation();
              alert("⚠️ Anti-Cheat: Copy-Pasting is disabled via Keyboard!");
          }
      });
      
      // 3. Disable Context Menu entirely (Optional, for stricter feel)
      // editor.updateOptions({ contextmenu: false });
  };

  // --- ACTION: RUN CODE ---
  const handleRun = async () => {
      if (!problem) return;
      setIsRunning(true);
      setConsoleTab('testcase'); 
      setActiveTestCaseId(0); 
      setRunResult(null);
      setSubmitResult(null); 

      try {
          const response = await api.post('/game/run', {
              roomId,
              sourceCode: code,
              language
          });
          setRunResult(response.data);
      } catch (error) {
          setRunResult({ success: false, error: "Execution Failed" });
      } finally {
          setIsRunning(false);
      }
  };

  // --- ACTION: SUBMIT CODE ---
  const handleSubmit = async () => {
      if (!problem) return;
      setIsSubmitting(true);
      setConsoleTab('result'); 
      setRunResult(null);

      try {
          let userId = 'guest_user';
          try {
             const userStr = localStorage.getItem('user');
             if (userStr) {
                 const user = JSON.parse(userStr);
                 userId = user._id || user.id || 'guest_user';
             }
             const separateId = localStorage.getItem('userId');
             if (separateId) userId = separateId;
          } catch (e) {}

          const response = await api.post('/game/submit', {
              roomId,
              userId: userId, 
              sourceCode: code,
              language,
              problemId: problem.id
          });

          const { results, isWin } = response.data;
          
          setSubmitResult({
              status: isWin ? 'Accepted' : 'Wrong Answer',
              results: results,
              isWin: isWin
          });

          if (isWin) {
              setMyProgress(100);
              setStatus('finished');
              setWinner(socket.id); 
              setWinReason('submission');
              socket.emit('update_progress', { roomId, progress: 100 });
              socket.emit('submission_success', { roomId });
          } else {
              const passedCount = results.filter(r => r.passed).length;
              const totalCount = results.length;
              const progress = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
              setMyProgress(progress);
              socket.emit('update_progress', { roomId, progress });
          }

      } catch (error) {
          setSubmitResult({
              status: 'Runtime Error',
              error: error.response?.data?.message || error.message,
              results: []
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- AI ANALYSIS ---
  const handleAnalyze = async () => {
      if (!code || code.length < 10) return; 
      
      setIsAnalyzing(true);
      try {
          const response = await analyzeCode({
              sourceCode: code,
              problemTitle: problem?.title || 'Coding Problem',
              language: language
          });
          setAnalysisResult(response.data);
          setShowAnalysisModal(true);
      } catch (error) {
          alert("Failed to analyze code. The AI might be busy.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  if (status === 'waiting') {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#1a1a1a] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Waiting for Opponent...</h2>
        <div className="bg-[#2a2a2a] px-6 py-3 rounded-lg flex items-center gap-4 border border-gray-700">
           <span className="font-mono text-xl tracking-wider text-green-400">{roomId}</span>
           <span className="text-sm text-gray-400">Share this Room ID</span>
        </div>
      </div>
    );
  }

  if (status === 'starting') {
      return (
        <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#1a1a1a] text-white">
            <div className="relative">
                <Swords className="w-24 h-24 text-orange-500 animate-pulse mb-8 mx-auto" />
            </div>
            <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                MATCH FOUND!
            </h2>
            <p className="text-gray-400 mb-8 text-lg">Prepare yourself. The battle begins in...</p>
            
            <div className="text-8xl font-mono font-bold text-white tabular-nums tracking-widest">
                {Math.floor(countdownTimer / 60).toString().padStart(2, '0')}:{(countdownTimer % 60).toString().padStart(2, '0')}
            </div>
            
            <div className="mt-8 flex gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Reading problem statement...</span>
            </div>
        </div>
      );
  }

  const testCases = problem?.examples || [];

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#1e1e1e] text-white overflow-hidden font-sans relative">
      
      {/* LEFT PANEL */}
      <div className="w-5/12 flex flex-col border-r border-[#333] bg-[#262626]">
        <div className="h-10 flex bg-[#333] items-center justify-between px-3">
            <button className={`px-4 text-xs font-medium flex items-center gap-2 bg-[#262626] text-white border-t-2 border-green-500 h-full`}>
                <Code2 className="w-4 h-4" /> Description
            </button>
            <div className="flex items-center gap-4">
                {strikes > 0 && (
                    <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded text-red-400 border border-red-500/30 text-xs font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{strikes}/3 Strikes</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-gray-300 bg-[#1a1a1a] px-3 py-1 rounded-full text-xs border border-[#444]">
                    <Timer className="w-3 h-3 text-orange-500" />
                    <span className="font-mono font-bold">{formatTime(gameTimer)}</span>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600">
             <div className="mb-6 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1 uppercase tracking-wider">
                            <span>You</span>
                            <span>{myProgress}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div style={{ width: `${myProgress}%` }} className="h-full bg-green-500 transition-all duration-500" />
                        </div>
                    </div>
                    <div className="flex-1">
                         <div className="flex justify-between text-[10px] text-gray-400 mb-1 uppercase tracking-wider">
                            <span>Opponent</span>
                            <span>{opponentProgress}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div style={{ width: `${opponentProgress}%` }} className="h-full bg-red-500 transition-all duration-500" />
                        </div>
                    </div>
                </div>
            </div>

            {problem && (
                <>
                    <h1 className="text-xl font-bold mb-2">{problem.title}</h1>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: problem.description }} />
                </>
            )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-7/12 flex flex-col bg-[#1e1e1e]">
        <div className="h-10 bg-[#262626] border-b border-[#333] flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
                <select value={language} onChange={handleLanguageChange} className="bg-[#333] text-xs text-gray-200 border border-[#444] rounded px-2 py-1 outline-none cursor-pointer focus:border-green-500">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                </select>
            </div>
            <div className="flex items-center gap-3">
                 <button onClick={handleRun} disabled={isRunning || isSubmitting || status === 'finished'} className="px-4 py-1.5 rounded text-xs font-medium bg-[#3a3a3a] text-gray-200 border border-[#444] flex items-center gap-2">
                    {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
                </button>
                 <button onClick={handleSubmit} disabled={isRunning || isSubmitting || status === 'finished'} className="px-4 py-1.5 rounded text-xs font-medium bg-green-600 text-white flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Submit
                </button>
            </div>
        </div>
        <div className="flex-1">
            <Editor 
                height="100%" 
                defaultLanguage="javascript" 
                language={language} 
                theme="vs-dark" 
                value={code} 
                onChange={setCode} 
                onMount={handleEditorDidMount} 
                options={{ 
                    minimap: { enabled: false }, 
                    fontSize: 14, 
                    automaticLayout: true 
                }} 
            />
        </div>
        <div className="h-1/3 min-h-[200px] border-t border-[#333] bg-[#262626] flex flex-col">
            <div className="h-9 flex items-center bg-[#333] px-1 gap-1">
                <button onClick={() => setConsoleTab('testcase')} className={`px-3 py-1 text-xs font-medium rounded-t flex items-center gap-2 ${consoleTab === 'testcase' ? 'bg-[#262626] text-white border-t border-x border-[#444]' : 'text-gray-400'}`}><CheckCircle2 className="w-3 h-3" /> Test Cases</button>
                <button onClick={() => setConsoleTab('result')} className={`px-3 py-1 text-xs font-medium rounded-t flex items-center gap-2 ${consoleTab === 'result' ? 'bg-[#262626] text-white border-t border-x border-[#444]' : 'text-gray-400'}`}><Terminal className="w-3 h-3" /> Result</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {/* --- TAB: TEST CASES --- */}
                {consoleTab === 'testcase' && (
                    <div className="flex gap-4 h-full">
                        <div className="w-24 flex flex-col gap-2 border-r border-[#333] pr-2">
                             {testCases.map((tc, i) => (
                                <button key={i} onClick={() => setActiveTestCaseId(i)} className={`px-3 py-2 text-xs text-left rounded ${activeTestCaseId === i ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}>Case {i + 1}</button>
                             ))}
                        </div>
                        <div className="flex-1 font-mono text-xs">
                             {testCases[activeTestCaseId] && (
                                <div className="space-y-4">
                                    <div><span className="text-gray-500 block mb-1">Input:</span><div className="bg-[#1e1e1e] p-3 rounded border border-[#333] text-gray-300">{testCases[activeTestCaseId].input}</div></div>
                                    
                                    {/* RUN Results */}
                                    {runResult && runResult.success && (
                                        <div className="pt-4 mt-4 border-t border-gray-700">
                                            <div className={`text-sm font-bold mb-2 ${runResult.result.passed ? 'text-green-500' : 'text-red-500'}`}>
                                                {runResult.result.passed ? 'Accepted' : 'Wrong Answer'}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Your Output</span>
                                                    <div className={`p-3 rounded-lg border ${runResult.result.passed ? 'bg-slate-900/50 border-slate-700 text-gray-300' : 'bg-red-900/10 border-red-900/30 text-red-400'} font-mono text-sm`}>
                                                        {runResult.result.actual}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Expected Output</span>
                                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-gray-300 font-mono text-sm">
                                                        {runResult.result.expected}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                )}
                {/* --- TAB: RESULT (SUBMIT) --- */}
                {consoleTab === 'result' && (
                    !submitResult ? <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs"><p>Submit to see hidden results.</p></div> : 
                    <div className="flex flex-col h-full">
                        <div className={`mb-4 text-lg font-bold ${submitResult.isWin ? 'text-green-500' : 'text-red-500'}`}>{submitResult.status}</div>
                        {submitResult.error ? (
                            <div className="bg-red-900/20 text-red-400 p-3 rounded border border-red-900/50 font-mono text-xs whitespace-pre-wrap">{submitResult.error}</div>
                        ) : (
                            <div className="flex gap-4 flex-1">
                                <div className="w-32 flex flex-col gap-2 border-r border-[#333] pr-2">
                                    {submitResult.results.map((res, i) => (
                                        <button key={i} onClick={() => setActiveTestCaseId(i)} className={`px-3 py-2 text-xs text-left rounded flex justify-between items-center ${activeTestCaseId === i ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}>
                                            Case {i + 1} {res.passed ? <div className="w-1.5 h-1.5 rounded-full bg-green-500"/> : <div className="w-1.5 h-1.5 rounded-full bg-red-500"/>}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 font-mono text-xs overflow-y-auto">
                                    {submitResult.results[activeTestCaseId] && (
                                        <>
                                            <div className="mb-3"><span className="text-gray-500 block mb-1">Input:</span><div className="bg-[#1e1e1e] p-3 rounded border border-[#333] text-gray-300 whitespace-pre-wrap">{submitResult.results[activeTestCaseId].input}</div></div>
                                            <div className="mb-3"><span className="text-gray-500 block mb-1">Output:</span><div className={`p-3 rounded border border-[#333] whitespace-pre-wrap ${submitResult.results[activeTestCaseId].passed ? 'bg-[#1e1e1e] text-gray-300' : 'bg-red-900/10 text-red-400 border-red-900/30'}`}>{submitResult.results[activeTestCaseId].actual}</div></div>
                                            <div><span className="text-gray-500 block mb-1">Expected:</span><div className="bg-[#1e1e1e] p-3 rounded border border-[#333] text-gray-300 whitespace-pre-wrap">{submitResult.results[activeTestCaseId].expected}</div></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- GAME OVER OVERLAY --- */}
      {status === 'finished' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-[#1e1e1e] border border-gray-700 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
                  <div className="flex justify-center mb-6">
                    {winner === socket.id ? 
                        <div className="bg-yellow-500/20 p-4 rounded-full"><Trophy className="w-16 h-16 text-yellow-500" /></div> : 
                        <div className="bg-gray-700/50 p-4 rounded-full"><XCircle className="w-16 h-16 text-gray-400" /></div>
                    }
                  </div>
                  <h2 className="text-3xl font-black mb-2 text-white">
                      {winner === socket.id ? 'VICTORY!' : 'DEFEAT'}
                  </h2>
                  <p className="text-gray-400 mb-8 text-sm">
                      {winReason === 'disqualified'
                        ? (winner === socket.id ? "Opponent was disqualified!" : "You were disqualified for tab switching.")
                        : winReason === 'timeout' 
                            ? (winner === socket.id ? "Opponent timed out!" : "Time's up! The Host wins by default.")
                            : (winner === socket.id ? "You solved it faster. Great job!" : "Your opponent was faster this time.")
                      }
                  </p>
                  
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors mb-3 flex items-center justify-center gap-2">
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />} Analyze My Code
                  </button>

                  <button onClick={() => window.location.href = '/dashboard'} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors">
                      Return to Dashboard
                  </button>
              </div>
          </div>
      )}

      {/* --- AI ANALYSIS MODAL --- */}
      {showAnalysisModal && analysisResult && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col animate-in zoom-in duration-300">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#252526]">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                          <BrainCircuit className="w-5 h-5" /> AI Coach Feedback
                      </h3>
                      <button onClick={() => setShowAnalysisModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#2a2a2a] p-4 rounded-xl border border-gray-700">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Time Complexity</div>
                              <div className="text-lg font-mono font-bold text-green-400">{analysisResult.timeComplexity}</div>
                          </div>
                          <div className="bg-[#2a2a2a] p-4 rounded-xl border border-gray-700">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Space Complexity</div>
                              <div className="text-lg font-mono font-bold text-blue-400">{analysisResult.spaceComplexity}</div>
                          </div>
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-200 mb-2">Feedback</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">{analysisResult.feedback}</p>
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-200 mb-2">Suggestions</h4>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                              {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-700 bg-[#252526] text-right">
                      <button onClick={() => setShowAnalysisModal(false)} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-sm text-white">Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Arena;