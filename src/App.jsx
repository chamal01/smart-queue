import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Monitor, LayoutDashboard, Settings, 
  Bell, ChevronRight, CheckCircle, SkipForward, Clock,
  Camera, Check, Activity, BarChart3, Download, Calendar, Database, AlertCircle,
  LogOut, Target, List, Trash2, ArrowUpDown
} from 'lucide-react';


import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';


let firebaseConfig;
const isCanvasEnvironment = typeof __firebase_config !== 'undefined';

if (isCanvasEnvironment) {
  firebaseConfig = JSON.parse(__firebase_config);
} else {

  firebaseConfig = {
    apiKey: "AIzaSyADNFloLHZDqN7k2lX43T5JIcsoGqM-vT4",
    authDomain: "smartque-6e002.firebaseapp.com",
    projectId: "smartque-6e002",
    storageBucket: "smartque-6e002.firebasestorage.app",
    messagingSenderId: "664777466386",
    appId: "1:664777466386:web:ee20413ef8a5cec219aecb"
  };
}


let app, auth, db;
const isValidConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isValidConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}


const rawAppId = typeof __app_id !== 'undefined' ? String(__app_id) : 'smart-queue-local';
const appId = rawAppId.split('_')[0].split('/')[0];


const INITIAL_SERVICES = [
  { id: 'S1', name: 'Account Opening', prefix: 'A', waitTime: 15 },
  { id: 'S2', name: 'Deposits', prefix: 'D', waitTime: 5 },
  { id: 'S3', name: 'Withdrawals', prefix: 'W', waitTime: 8 },
  { id: 'S4', name: 'Customer Service', prefix: 'C', waitTime: 20 },
];

const INITIAL_COUNTERS = [
  { id: 1, name: 'Counter 01', services: ['D', 'W'], active: true, currentToken: null },
  { id: 2, name: 'Counter 02', services: ['A', 'C'], active: true, currentToken: null },
  { id: 3, name: 'Counter 03', services: ['D', 'W', 'C'], active: true, currentToken: null },
];




const NavBar = ({ activeView, setActiveView, dbConnected, dbError }) => {
  const NavButton = ({ icon, label, view }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeView === view ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg relative z-50">
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <Activity className="text-blue-400" />
        <span>SmartQueue OS</span>
        
    
        <div className={`ml-4 flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
          dbError ? 'bg-red-500/10 text-red-400 border-red-500/20' 
          : dbConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        }`}>
          {dbError ? <AlertCircle size={12} /> : <Database size={12} />}
          {dbError ? dbError : dbConnected ? 'Live Sync Active' : 'Connecting DB...'}
        </div>
      </div>
      <div className="flex gap-2">
        <NavButton icon={<Camera size={18}/>} label="AI Kiosk" view="kiosk" />
        <NavButton icon={<Monitor size={18}/>} label="Display Board" view="display" />
        <NavButton icon={<Users size={18}/>} label="Staff Portal" view="staff" />
        <NavButton icon={<LayoutDashboard size={18}/>} label="Admin" view="admin" />
      </div>
    </nav>
  );
};

const StatCard = ({ icon, label, value, trend, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <div className={`p-6 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/60 rounded-lg">{icon}</div>
      </div>
      <div>
        <h4 className="text-3xl font-black mb-1">{value}</h4>
        <p className="font-medium text-sm opacity-80">{label}</p>
        <p className="text-xs mt-2 opacity-60 font-medium">{trend}</p>
      </div>
    </div>
  );
};


const KioskView = ({ services, dbConnected, generateToken }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedToken, setScannedToken] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const simulateDetection = (serviceId) => {
    let capturedImage = null;
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      capturedImage = canvas.toDataURL('image/jpeg', 0.8);
    }

    setIsScanning(true);
    setScannedToken(null);
    setTimeout(async () => {
      const token = await generateToken(serviceId, capturedImage);
      setScannedToken(token);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] bg-slate-50 p-6">
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="relative w-40 h-40 mx-auto mb-6 rounded-[2rem] overflow-hidden border-4 border-blue-100 bg-slate-100 flex items-center justify-center shadow-inner">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          {isScanning && <div className="absolute inset-0 bg-blue-500/30 z-10 animate-pulse backdrop-blur-sm"></div>}
          <Camera size={40} className="text-slate-300 absolute -z-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to SmartQueue</h2>
        <p className="text-slate-500 mb-8">Select a service to join the queue</p>

        {!isScanning && !scannedToken && (
          <div className="space-y-3">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => simulateDetection(s.id)}
                disabled={!dbConnected}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-transparent rounded-xl font-medium transition-all flex justify-between items-center group disabled:opacity-50"
              >
                <span>{s.name}</span>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}

        {isScanning && (
          <div className="py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium animate-pulse">Processing request...</p>
          </div>
        )}

        {scannedToken && (
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-inner relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <p className="text-blue-100 uppercase tracking-widest text-sm mb-1">Your Token Number</p>
            <h1 className="text-6xl font-black mb-4 tracking-tight">{scannedToken.number}</h1>
            <div className="bg-blue-700/50 rounded-lg p-3 text-sm flex justify-between items-center">
              <span>{services.find(s => s.id === scannedToken.serviceId).name}</span>
              <span className="font-bold">Wait: ~{services.find(s => s.id === scannedToken.serviceId).waitTime} min</span>
            </div>
            <button 
              onClick={() => setScannedToken(null)}
              className="mt-6 w-full bg-white text-blue-700 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


const DisplayBoardView = ({ tokens, counters }) => {
  const servingTokens = tokens.filter(t => t.status === 'serving');
  const waitingTokens = tokens.filter(t => t.status === 'waiting').slice(0, 5);

  return (
    <div className="min-h-[85vh] bg-slate-900 p-8 flex gap-8 font-sans">
      <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-800">
        <div className="bg-blue-600 p-4 text-center">
          <h1 className="text-white text-4xl font-black tracking-widest">NOW SERVING</h1>
        </div>
        <div className="flex-1 flex flex-col justify-center p-8 gap-6">
          {servingTokens.length > 0 ? servingTokens.map(t => {
            const counter = counters.find(c => c.id === t.counterId);
            return (
              <div key={t.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 flex justify-between items-center animate-pulse-slow">
                <span className="text-yellow-400 text-8xl font-black tracking-tighter">{t.number}</span>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-2xl uppercase tracking-widest mb-2">Proceed To</span>
                  <span className="text-white text-6xl font-bold">{counter?.name}</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-slate-500 text-3xl font-light">No active tokens being served</div>
          )}
        </div>
        <div className="bg-slate-800 p-3 overflow-hidden flex items-center">
          <div className="animate-marquee whitespace-nowrap text-emerald-400 text-xl font-medium tracking-wide">
            Please have your documents ready before approaching the counter.   *** Priority queues are served separately.   *** Estimated wait time is updated dynamically.
          </div>
        </div>
      </div>

      <div className="w-96 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        <div className="bg-slate-700 p-4 text-center">
          <h2 className="text-white text-2xl font-bold tracking-wider">NEXT IN LINE</h2>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
          {waitingTokens.map(t => (
            <div key={t.id} className="bg-slate-900 rounded-xl p-5 flex justify-between items-center shadow-inner border border-slate-800/50">
              <span className="text-white text-4xl font-bold">{t.number}</span>
              <span className="text-slate-400 font-medium uppercase text-sm">Waiting</span>
            </div>
          ))}
          {waitingTokens.length === 0 && (
            <div className="text-slate-500 text-center mt-10">Queue is empty</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StaffDashboardView = ({ counters, tokens, services, dbConnected, callNextToken, completeToken, skipToken }) => {
  const [staffName, setStaffName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCounterId, setSelectedCounterId] = useState(2);

  const activeCounter = counters.find(c => c.id === selectedCounterId); 
  if (!activeCounter) return <div className="p-8">Loading counters...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Staff Login</h2>
            <p className="text-slate-500 mt-1">Enter your details to open counter</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
              <input 
                type="text" 
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Assigned Counter</label>
              <select 
                value={selectedCounterId}
                onChange={(e) => setSelectedCounterId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium bg-white"
              >
                {counters.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Handles: {c.services.join(', ')})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                if(staffName.trim()) setIsLoggedIn(true);
                else alert("Please enter your name to login.");
              }}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all mt-4"
            >
              Open Counter
            </button>
          </div>
        </div>
      </div>
    );
  }

  
  const myCurrentToken = tokens.find(t => t.number === activeCounter.currentToken && t.status === 'serving');
  

  const supportedWaitingTokens = tokens.filter(t => 
    t.status === 'waiting' && 
    activeCounter.services.includes(services.find(s => s.id === t.serviceId).prefix)
  );
  const waitingCount = supportedWaitingTokens.length;

  return (
    <div className="min-h-[85vh] bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Officer Workspace</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-200">
                <Users size={14} /> {staffName}
              </span>
              <span className="text-slate-700 font-bold">{activeCounter.name}</span>
              <span className="text-slate-500 font-medium">• Status: <span className="text-emerald-500">Active</span></span>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="ml-4 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
              >
                <LogOut size={12} /> Leave Counter
              </button>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
            <Users className="text-blue-500" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Total Waiting</p>
              <p className="text-xl font-black text-slate-800">{waitingCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Monitor size={20} className="text-blue-500"/> Current Customer
              </h2>
              
              {myCurrentToken ? (
                <div className="text-center py-8">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Serving Token</p>
                  
                  {myCurrentToken.image ? (
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-slate-100 shadow-md">
                      <img src={myCurrentToken.image} alt="Customer" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200">
                      <Users size={40} className="text-slate-400" />
                    </div>
                  )}

                  <h1 className="text-7xl font-black text-blue-600 tracking-tighter mb-4">{myCurrentToken.number}</h1>
                  <span className="inline-block px-4 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium mb-12 border border-slate-200">
                    {services.find(s => s.id === myCurrentToken.serviceId).name}
                  </span>
                  
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => skipToken(myCurrentToken.number, activeCounter.id)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <SkipForward size={18} /> No Show / Skip
                    </button>
                    <button 
                      onClick={() => completeToken(myCurrentToken.number, activeCounter.id)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      <CheckCircle size={18} /> Complete Service
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Counter Idle</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">You are currently not serving anyone.</p>
                  <button 
                    onClick={() => callNextToken(activeCounter.id, staffName)}
                    disabled={!dbConnected}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    <Bell size={18} /> Call Next Customer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Waiting Queue</h3>
              <p className="text-sm text-slate-500">For services: {activeCounter.services.join(', ')}</p>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {supportedWaitingTokens.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                      {t.image ? (
                        <img src={t.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        t.number.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{t.number}</p>
                      <p className="text-xs text-slate-500">{services.find(s => s.id === t.serviceId).name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded">Waiting</span>
                </div>
              ))}
              {supportedWaitingTokens.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-sm">No customers in queue for this counter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const AdminDashboardView = ({ tokens, counters, services, onClearDatabase }) => {
  const totalServed = tokens.filter(t => t.status === 'completed').length;
  const totalWaiting = tokens.filter(t => t.status === 'waiting').length;
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  

  const [showResetConfirm, setShowResetConfirm] = useState(false);


  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

 
  const officerStats = tokens.reduce((acc, t) => {
    if (t.status === 'completed' && t.officerName) {
      if (!acc[t.officerName]) acc[t.officerName] = 0;
      acc[t.officerName]++;
    }
    return acc;
  }, {});

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getDuration = (t) => {
    if (t.calledTime && t.completedTime) {
      return (new Date(t.completedTime) - new Date(t.calledTime)) / 60000;
    }
    return 0;
  };

  const handleExportExcel = () => {
    const headers = ["Token Number", "Service Type", "Status", "Assigned Counter", "Assigned Officer", "Arrival Time", "Call Time (In)", "Close Time (Out)", "Duration (Mins)"];
    
    const filteredTokens = tokens.filter(t => {
      const tokenDate = new Date(t.timestamp);
      let isValid = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (tokenDate < start) isValid = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (tokenDate > end) isValid = false;
      }
      return isValid;
    });

    if (filteredTokens.length === 0) {
      alert("No records found for the selected date range.");
      return;
    }

    const rows = filteredTokens.map(t => {
      const serviceName = services.find(s => s.id === t.serviceId)?.name || 'Unknown';
      const counterName = counters.find(c => c.id === t.counterId)?.name || 'None';
      const officer = t.officerName || 'N/A';
      
      const arrivalDate = t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A';
      const calledDate = t.calledTime ? new Date(t.calledTime).toLocaleString() : 'N/A';
      const completedDate = t.completedTime ? new Date(t.completedTime).toLocaleString() : 'N/A';
      
      let durationMins = 'N/A';
      if (t.calledTime && t.completedTime) {
        durationMins = getDuration(t).toFixed(2);
      }

      return `"${t.number}","${serviceName}","${t.status}","${counterName}","${officer}","${arrivalDate}","${calledDate}","${completedDate}","${durationMins}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SmartQueue_Report_${startDate || 'All'}_to_${endDate || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const sortedTokens = [...tokens].sort((a, b) => {
    let valA, valB;
    if (sortField === 'timestamp') {
      valA = new Date(a.timestamp);
      valB = new Date(b.timestamp);
    } else if (sortField === 'calledTime') {
      valA = a.calledTime ? new Date(a.calledTime) : new Date(0);
      valB = b.calledTime ? new Date(b.calledTime) : new Date(0);
    } else if (sortField === 'completedTime') {
      valA = a.completedTime ? new Date(a.completedTime) : new Date(0);
      valB = b.completedTime ? new Date(b.completedTime) : new Date(0);
    } else if (sortField === 'duration') {
      valA = getDuration(a);
      valB = getDuration(b);
    } else {
      valA = (a[sortField] || '').toString().toLowerCase();
      valB = (b[sortField] || '').toString().toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="min-h-[85vh] bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">System Analytics</h1>
            <p className="text-slate-500">Real-time overview of branch performance & database logs</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Start Date" className="text-sm border-none outline-none text-slate-600 bg-transparent cursor-pointer font-medium" />
                <span className="text-slate-300 font-bold">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="End Date" className="text-sm border-none outline-none text-slate-600 bg-transparent cursor-pointer font-medium" />
              </div>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-100 font-bold transition-colors shadow-sm">
                <Download size={18} /> Export Data
              </button>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-4 gap-6">
          <StatCard icon={<Users />} label="Total Customers" value={tokens.length} trend="Historical data" color="blue" />
          <StatCard icon={<Clock />} label="Currently Waiting" value={totalWaiting} trend="Live count" color="orange" />
          <StatCard icon={<Check />} label="Services Completed" value={totalServed} trend="Historical data" color="emerald" />
          <StatCard icon={<BarChart3 />} label="Active Counters" value={counters.filter(c=>c.active).length} trend="Live count" color="purple" />
        </div>


        <div className="grid grid-cols-3 gap-6">
          
     
          <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Target size={18} className="text-blue-500"/> Officer Targets
            </h3>
            
            <div className="space-y-6">
              {Object.keys(officerStats).length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                  No services completed today.
                </p>
              ) : (
                Object.entries(officerStats).map(([name, count]) => {
                  const dailyTarget = 20;
                  const monthlyTarget = 400;
                  
                  const dailyPercentage = Math.min((count / dailyTarget) * 100, 100);
                  const monthlyPercentage = Math.min((count / monthlyTarget) * 100, 100);
                  
                  return (
                    <div key={name} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">{name}</h4>
                      
                      {/* Daily bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Daily Progress</span>
                          <span className="font-semibold text-slate-700">{count} / {dailyTarget}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${dailyPercentage}%` }}></div>
                        </div>
                      </div>

                      {/* Monthly bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Monthly Target</span>
                          <span className="font-semibold text-slate-700">{count} / {monthlyTarget}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${monthlyPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Logs Table */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[28rem] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={18} className="text-blue-500" />
                <h3 className="font-bold text-slate-800">Live Customer Logs</h3>
              </div>
              <span className="text-xs text-slate-400">Click headers to sort</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0 shadow-sm border-b border-slate-200">
                  <tr>
                    <th onClick={() => handleSort('number')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1">Token <ArrowUpDown size={12}/></span>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1">Status <ArrowUpDown size={12}/></span>
                    </th>
                    <th onClick={() => handleSort('officerName')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1">Officer <ArrowUpDown size={12}/></span>
                    </th>
                    <th onClick={() => handleSort('calledTime')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1">In (Called) <ArrowUpDown size={12}/></span>
                    </th>
                    <th onClick={() => handleSort('duration')} className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="flex items-center gap-1">Duration <ArrowUpDown size={12}/></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTokens.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-400">No token data available yet.</td></tr>
                  ) : (
                    sortedTokens.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                          {t.image && (
                            <img src={t.image} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                          )}
                          {t.number}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            t.status === 'waiting' ? 'bg-orange-100 text-orange-700' : 
                            t.status === 'serving' ? 'bg-blue-100 text-blue-700' : 
                            t.status === 'skipped' ? 'bg-red-100 text-red-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{t.officerName || '-'}</td>
                        <td className="px-4 py-3 text-xs">{t.calledTime ? new Date(t.calledTime).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">
                          {t.calledTime && t.completedTime ? `${getDuration(t).toFixed(1)} mins` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Danger Zone: Maintenance & Seeding (Iframe Safe Custom Alerts) */}
        <div className="bg-red-50/50 border border-red-200/60 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-2">
            <Trash2 size={20} /> Danger Zone
          </h3>
          <p className="text-sm text-red-700 mb-4">Clearing the database will permanently delete all queue logs, timestamps, and customer images across Firestore.</p>
          
          {!showResetConfirm ? (
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm text-sm"
            >
              Reset Queue Database
            </button>
          ) : (
            <div className="bg-white border border-red-300 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm font-bold text-red-600">Are you absolutely sure you want to proceed with full wipeout?</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    await onClearDatabase();
                    setShowResetConfirm(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Yes, Wipe Database
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};



export default function App() {
  const [activeView, setActiveView] = useState('kiosk');
  const [services] = useState(INITIAL_SERVICES);
  

  const [user, setUser] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [configError, setConfigError] = useState(!isValidConfig);
  const [dbError, setDbError] = useState(null);
  

  const [tokens, setTokens] = useState([]);
  const [counters, setCounters] = useState([]);


  useEffect(() => {
    if (!isValidConfig) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        setDbError("Auth Failed: Enable Anonymous Sign-In in Firebase Console.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDbConnected(true);
        setDbError(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !dbConnected) return;

    const tokensRef = collection(db, 'artifacts', appId, 'public', 'data', 'tokens');
    const countersRef = collection(db, 'artifacts', appId, 'public', 'data', 'counters');

    
    const unsubTokens = onSnapshot(tokensRef, (snapshot) => {
      const fetchedTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by timestamp to keep queue order
      fetchedTokens.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setTokens(fetchedTokens);
      setDbError(null);
    }, (error) => {
      console.error("Tokens Sync Error:", error);
      setDbError("Permission Denied: Update Firestore Rules.");
    });


    const unsubCounters = onSnapshot(countersRef, (snapshot) => {
      let fetchedCounters = snapshot.docs.map(doc => ({ id: Number(doc.id), ...doc.data() }));
      

      if (fetchedCounters.length === 0) {
        INITIAL_COUNTERS.forEach(c => {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'counters', c.id.toString()), c);
        });
        fetchedCounters = INITIAL_COUNTERS;
      }
      

      fetchedCounters.sort((a, b) => a.id - b.id);
      setCounters(fetchedCounters);
      setDbError(null);
    }, (error) => {
      console.error("Counters Sync Error:", error);
      setDbError("Permission Denied: Update Firestore Rules.");
    });

    return () => {
      unsubTokens();
      unsubCounters();
    };
  }, [user, dbConnected]);



  const generateToken = async (serviceId, imageData = null) => {
    if (!dbConnected) return null;
    
    const service = services.find(s => s.id === serviceId);
    const serviceTokens = tokens.filter(t => t.serviceId === serviceId);
    const nextNumber = `${service.prefix}${(serviceTokens.length + 1).toString().padStart(3, '0')}`;
    
    const tokenId = Date.now().toString();
    const newToken = {
      number: nextNumber,
      serviceId: service.id,
      status: 'waiting',
      counterId: null,
      timestamp: new Date().toISOString(),
      calledTime: null,
      completedTime: null,
      officerName: null,
      image: imageData
    };
    
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', tokenId), newToken);
      return newToken;
    } catch (e) {
      console.error("Error generating token:", e);
      return null;
    }
  };

  const callNextToken = async (counterId, officerName) => {
    if (!dbConnected) return;
    const counter = counters.find(c => c.id === counterId);
    if (!counter) return;

    const nextToken = tokens.find(t => 
      t.status === 'waiting' && 
      counter.services.includes(services.find(s => s.id === t.serviceId).prefix)
    );

    if (nextToken) {
      try {
        if (counter.currentToken) {
          
          const oldToken = tokens.find(t => t.number === counter.currentToken && t.status === 'serving');
          if (oldToken) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', oldToken.id), { 
              status: 'completed',
              completedTime: new Date().toISOString()
            });
          }
        }

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', nextToken.id), {
          status: 'serving',
          counterId: counter.id,
          officerName: officerName || 'Unknown Officer',
          calledTime: new Date().toISOString()
        });
        
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'counters', counter.id.toString()), {
          currentToken: nextToken.number
        });
      } catch (e) {
        console.error("Error calling token:", e);
      }
    } else {
      alert(`No waiting customers for ${counter.name}'s assigned services (${counter.services.join(', ')}).`);
    }
  };

  const completeToken = async (tokenNumber, counterId) => {
    if (!dbConnected) return;
   
    const token = tokens.find(t => t.number === tokenNumber && t.status === 'serving');
    if (token) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', token.id), { 
        status: 'completed',
        completedTime: new Date().toISOString()
      });
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'counters', counterId.toString()), { currentToken: null });
  };

  const skipToken = async (tokenNumber, counterId) => {
    if (!dbConnected) return;
   
    const token = tokens.find(t => t.number === tokenNumber && t.status === 'serving');
    if (token) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', token.id), { 
        status: 'skipped', 
        counterId: null,
        completedTime: new Date().toISOString()
      });
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'counters', counterId.toString()), { currentToken: null });
  };

 
  const handleClearDatabase = async () => {
    if (!dbConnected) return;
    try {

      for (const t of tokens) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tokens', t.id));
      }
    
      for (const c of counters) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'counters', c.id.toString()), {
          currentToken: null
        });
      }
    } catch (err) {
      console.error("Failed to reset firestore db elements:", err);
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white max-w-2xl w-full p-8 rounded-2xl shadow-xl border border-red-100 text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Firebase Configuration Required</h1>
          <p className="text-slate-600 mb-6 text-lg">
            Because you are running this application locally, you need to provide your own Firebase configuration keys to enable the real-time database.
          </p>
          <div className="bg-slate-900 text-left p-6 rounded-xl overflow-x-auto text-sm text-green-400 font-mono mb-6 shadow-inner">
            <p className="text-slate-400 mb-2">// 1. Open src/App.jsx</p>
            <p className="text-slate-400 mb-2">// 2. Find line 16 and replace the configuration with your keys:</p>
            <p>firebaseConfig = {'{'}</p>
            <p className="pl-4">apiKey: "YOUR_ACTUAL_API_KEY",</p>
            <p className="pl-4">authDomain: "your-project.firebaseapp.com",</p>
            <p className="pl-4">projectId: "your-project",</p>
            <p className="pl-4">...</p>
            <p>{'};'}</p>
          </div>
          <p className="text-slate-500 text-sm">After saving the file, Vite will automatically reload the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 25s linear infinite; }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}} />
      <NavBar activeView={activeView} setActiveView={setActiveView} dbConnected={dbConnected} dbError={dbError} />
      
      <main className="flex-1 overflow-x-hidden">
        {activeView === 'kiosk' && <KioskView services={services} dbConnected={dbConnected} generateToken={generateToken} />}
        {activeView === 'display' && <DisplayBoardView tokens={tokens} counters={counters} />}
        {activeView === 'staff' && (
          <StaffDashboardView 
            counters={counters} 
            tokens={tokens} 
            services={services} 
            dbConnected={dbConnected} 
            callNextToken={callNextToken} 
            completeToken={completeToken} 
            skipToken={skipToken} 
          />
        )}
        {activeView === 'admin' && (
          <AdminDashboardView 
            tokens={tokens} 
            counters={counters} 
            services={services} 
            onClearDatabase={handleClearDatabase}
          />
        )}
      </main>
    </div>
  );
}