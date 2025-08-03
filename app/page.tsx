/* eslint-disable */
// @ts-nocheck

'use client';

import React, { useState, useEffect, useRef, FC, ChangeEvent } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  Firestore,
  DocumentData,
} from 'firebase/firestore';
import { ChevronLeft, ChevronRight, UserPlus, Trash2, Lock, Eye } from 'lucide-react';

// --- Configuration ---
// Make sure to add these to your .env.local file:
// NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
// NEXT_PUBLIC_APP_ID=your-app-id
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG 
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) 
  : null;
const appId = process.env.NEXT_PUBLIC_APP_ID || 'shift-scheduler-app';

// --- Type Definitions ---
interface ShiftType {
  name: string;
  color: string;
}

interface Member {
  id: string;
  name: string;
  shifts: string; // Stored as a JSON string in Firestore
}

type ShiftsObject = Record<string, string>; // e.g., { "2024-7-15": "Night Shift..." }

// --- Helper Function ---
const tryParseJson = (jsonString: string): ShiftsObject | null => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return null;
  }
};

const SchedulerPage: FC = () => {
  // --- State Management ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<ShiftsObject>({});
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- Constants ---
  const initialMembersList: string[] = [
    "17006 Md. Istiaqe Ahmed", "17012 Md. Keramot Ali", "17057 MD. Ibrahim Khalil",
    "17030 Mehedi Hasan Babu", "17052 MD. Sagor", "17092 Shishir Chowdhory",
    "17107 Md Rifat Hossain", "17112 Md. Taufiqul Islam Tomal", "17201 Kazi Pial Hasan Borno",
    "17196 Tanzir Ibne Ali", "17263 Anika Ivnath", "17261 Shah. Afsar Ali",
    "17264 Md Rahatul Islam", "17266 Nayon das", "17275 Md Anas Alif",
  ];

  const shiftTypes: ShiftType[] = [
    { name: 'Morning Shift (07:00 - 03:00 PM)', color: 'bg-yellow-500' },
    { name: 'Evening Shift (02:50 - 11:00 PM)', color: 'bg-purple-500' },
    { name: 'Night Shift (10:30 - 07:00 AM)', color: 'bg-green-500' },
    { name: 'Offday', color: 'bg-blue-500' },
    { name: 'Leave', color: 'bg-red-500' },
    { name: 'Absent', color: 'bg-gray-500' },
  ];

  // --- Demo Data for View Mode ---
  const getDemoMembers = (): Member[] => {
    return initialMembersList.map((name, index) => ({
      id: `demo-${index}`,
      name,
      shifts: JSON.stringify(generateDemoShifts())
    }));
  };

  const generateDemoShifts = (): ShiftsObject => {
    const shifts: ShiftsObject = {};
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate some demo shifts
    for (let day = 1; day <= daysInMonth; day++) {
      if (Math.random() > 0.3) { // 70% chance of having a shift
        const randomShift = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        shifts[`${year}-${month}-${day}`] = randomShift.name;
      }
    }
    
    return shifts;
  };

  // --- Effects ---
  useEffect(() => {
    // If no Firebase config, start in view mode with demo data
    if (!firebaseConfig || !firebaseConfig.apiKey) {
      console.log("No Firebase config found. Running in demo mode.");
      setFirebaseError("Firebase configuration not found. Running in demo mode with sample data.");
      setMembers(getDemoMembers());
      setIsLoading(false);
      return;
    }

    try {
      const app: FirebaseApp = initializeApp(firebaseConfig);
      const authInstance: Auth = getAuth(app);
      const firestoreInstance: Firestore = getFirestore(app);
      setAuth(authInstance);
      setDb(firestoreInstance);

      // Set up auth state listener
      const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setCurrentUserId(user.uid);
          setIsAuthReady(true);
          setViewMode('edit'); // Enable edit mode when authenticated
        } else {
          // Try anonymous authentication for read access
          try {
            await signInAnonymously(authInstance);
          } catch (error) {
            console.error("Anonymous authentication failed:", error);
            setFirebaseError("Authentication failed. Running in demo mode.");
            setMembers(getDemoMembers());
            setIsLoading(false);
          }
        }
      });

      return () => unsubscribeAuth();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setFirebaseError("Firebase initialization failed. Running in demo mode.");
      setMembers(getDemoMembers());
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (!db || !isAuthReady || firebaseError) return;
    
    const memberCollectionRef = collection(db, `artifacts/${appId}/public/data/members`);

    const checkAndPopulate = async () => {
      try {
        const snapshot = await getDocs(query(memberCollectionRef));
        if (snapshot.empty) {
          console.log("Populating initial members...");
          for (const name of initialMembersList) {
            await addDoc(memberCollectionRef, { name, shifts: JSON.stringify({}) });
          }
        }
      } catch (error) {
        console.error("Error during initial member setup:", error);
        // Fallback to demo data if Firebase fails
        setFirebaseError("Failed to connect to database. Using demo data.");
        setMembers(getDemoMembers());
        setIsLoading(false);
      }
    };

    checkAndPopulate();
    
    const unsubscribe = onSnapshot(
      query(memberCollectionRef), 
      (snapshot) => {
        const fetchedMembers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Member, 'id'>),
        }));
        setMembers(fetchedMembers);
        setIsLoading(false);
      }, 
      (error) => {
        console.error("Failed to fetch members:", error);
        setFirebaseError("Failed to fetch data. Using demo data.");
        setMembers(getDemoMembers());
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, isAuthReady, firebaseError]);

  useEffect(() => {
    if (viewMode === 'view' || !selectedMemberId) {
      // In view mode, use demo data
      if (viewMode === 'view' && selectedMemberId) {
        const member = members.find(m => m.id === selectedMemberId);
        if (member) {
          setSelectedShifts(tryParseJson(member.shifts) || {});
        }
      } else {
        setSelectedShifts({});
      }
      return;
    }

    if (!db || !isAuthReady) {
      setSelectedShifts({});
      return;
    }

    const memberDocRef = doc(db, `artifacts/${appId}/public/data/members/${selectedMemberId}`);
    const unsubscribe = onSnapshot(memberDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        setSelectedShifts(tryParseJson(data.shifts) || {});
      } else {
        setSelectedShifts({});
      }
    }, (error) => {
      console.error("Failed to fetch shift data:", error);
    });

    return () => unsubscribe();
  }, [db, isAuthReady, selectedMemberId, viewMode, members]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleAddMember = async () => {
    if (!newMemberName.trim() || !newMemberId.trim() || !db || viewMode === 'view') return;
    const combinedName = `${newMemberId} ${newMemberName}`;
    try {
      const memberCollectionRef = collection(db, `artifacts/${appId}/public/data/members`);
      await addDoc(memberCollectionRef, { name: combinedName, shifts: JSON.stringify({}) });
      setNewMemberName('');
      setNewMemberId('');
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!db || viewMode === 'view') return;
    try {
      const memberDocRef = doc(db, `artifacts/${appId}/public/data/members/${memberId}`);
      await deleteDoc(memberDocRef);
      if (memberId === selectedMemberId) {
        setSelectedMemberId(null);
      }
    } catch (e) {
      console.error("Error removing document: ", e);
    }
  };

  const handleShiftSelection = async (day: number, shiftName: string) => {
    if (!selectedMemberId || viewMode === 'view') return;
    
    if (!db) {
      // In demo mode, show alert
      alert("This is demo mode. Connect Firebase to enable editing.");
      return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayKey = `${year}-${month}-${day}`;
    
    const newShifts: ShiftsObject = { ...selectedShifts };
    if (newShifts[dayKey] === shiftName) {
      delete newShifts[dayKey];
    } else {
      newShifts[dayKey] = shiftName;
    }
    
    try {
      const memberDocRef = doc(db, `artifacts/${appId}/public/data/members/${selectedMemberId}`);
      await updateDoc(memberDocRef, { shifts: JSON.stringify(newShifts) });
    } catch (e) {
      console.error("Error updating document: ", e);
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleAuth = async () => {
    if (!auth) return;
    
    try {
      await signInAnonymously(auth);
      setViewMode('edit');
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Authentication failed. Please check your Firebase configuration.");
    }
  };
  
  // --- Rendering Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const getShiftColorClass = (day: number) => {
    const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    const shiftType = selectedShifts[dayKey];
    return shiftTypes.find(s => s.name === shiftType)?.color || '';
  };
  
  const calculateSummary = () => {
    const currentMonthShifts = Object.values(selectedShifts);
    const absentCount = currentMonthShifts.filter(s => s.includes('Absent')).length;
    const leaveCount = currentMonthShifts.filter(s => s.includes('Leave')).length;
    const nightCount = currentMonthShifts.filter(s => s.includes('Night')).length;
    return { absentCount, leaveCount, nightCount };
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const calendarDays: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${year}-${month}-${day}`;
      const colorClass = getShiftColorClass(day);
      const shiftName = selectedShifts[dayKey];
      const canEdit = selectedMemberId && viewMode === 'edit';
      
      calendarDays.push(
        <div key={day} className="relative p-2 min-h-[80px]">
          <div
            className={`w-full h-full p-2 text-center rounded-lg flex flex-col justify-between items-center transition-colors duration-200 ${colorClass} ${colorClass ? 'text-white' : 'hover:bg-gray-200 bg-white text-gray-800 border border-gray-200'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => canEdit && setActiveDropdown(day)}
          >
            <span className="font-bold text-sm">{day}</span>
            <span className="text-xs font-semibold break-words">{shiftName}</span>
          </div>
          {activeDropdown === day && viewMode === 'edit' && (
            <div ref={dropdownRef} className="absolute z-10 mt-1 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {shiftTypes.map((shift) => (
                <div key={shift.name} onClick={() => handleShiftSelection(day, shift.name)} className="flex items-center gap-2 p-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  <div className={`w-4 h-4 rounded ${shift.color}`}></div>
                  <span>{shift.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return calendarDays;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Loading Scheduler...</p>
      </div>
    );
  }

  const { absentCount, leaveCount, nightCount } = calculateSummary();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <main className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Status Banner */}
        {firebaseError && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-yellow-700">
                  <span className="font-medium">Demo Mode:</span> {firebaseError}
                </p>
              </div>
              {!db && (
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {viewMode === 'view' ? (
                <Eye className="h-5 w-5 text-blue-500" />
              ) : (
                <Lock className="h-5 w-5 text-green-500" />
              )}
              <span className="font-medium text-gray-800">
                Mode: {viewMode === 'view' ? 'View Only' : 'Edit Mode'}
              </span>
            </div>
            {firebaseError && (
              <button
                onClick={handleAuth}
                disabled={!auth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Enable Editing
              </button>
            )}
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {selectedMemberId ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-gray-600 font-medium mb-4">
                {weekDays.map(day => <div key={day} className="p-2">{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">Attendance Summary</h2>
                <div className="flex flex-wrap gap-4">
                  <div className="p-2 bg-gray-500 text-white rounded-md shadow-sm">Absent: <span className="font-bold">{absentCount}</span></div>
                  <div className="p-2 bg-red-500 text-white rounded-md shadow-sm">Leave: <span className="font-bold">{leaveCount}</span></div>
                  <div className="p-2 bg-green-500 text-white rounded-md shadow-sm">Night: <span className="font-bold">{nightCount}</span></div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-96 text-center">
              <p className="text-xl text-gray-700">Please select a team member below to view their schedule.</p>
            </div>
          )}
        </div>

        {/* Members Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>
          
          {viewMode === 'edit' && (
            <div className="flex flex-col sm:flex-row gap-2 items-center mb-6">
              <input 
                type="text" 
                value={newMemberId} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMemberId(e.target.value)} 
                placeholder="Employee ID" 
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-1/4" 
              />
              <input 
                type="text" 
                value={newMemberName} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMemberName(e.target.value)} 
                placeholder="Member Name" 
                className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button 
                onClick={handleAddMember} 
                className="p-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                <UserPlus className="w-5 h-5 mx-auto" />
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.length > 0 ? members.map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedMemberId(prevId => prevId === member.id ? null : member.id)} 
                  className={`flex-grow p-2 text-left rounded-lg font-medium transition-colors text-gray-800 ${selectedMemberId === member.id ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {member.name}
                </button>
                {viewMode === 'edit' && (
                  <button 
                    onClick={() => handleRemoveMember(member.id)} 
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg" 
                    title="Remove"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )) : <p className="col-span-full text-gray-500">No members found.</p>}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SchedulerPage;