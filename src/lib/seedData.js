import { db } from './firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc } from 'firebase/firestore';

const COLLEGES = [
  'CICS — College of Information and Computing Sciences',
  'CAS — College of Arts and Sciences',
  'CBE — College of Business and Economics',
  'COE — College of Engineering',
  'CON — College of Nursing',
  'CCJE — College of Criminal Justice Education'
];

const PURPOSES = ['Reading', 'Studying', 'Computer Use', 'Research', 'Meeting'];
const USER_TYPES = ['Student', 'Faculty', 'Staff'];

// Pool of real names for a more authentic look
const REAL_NAMES = [
  'Mark Aeron Lumawag', 'Janella Reyes', 'Kristian Dela Cruz', 
  'Sophia Mendoza', 'Paolo Santos', 'Althea Garcia', 
  'Joshua Bautista', 'Bianca Pangilinan', 'Miguel Castro', 
  'Angel Locsin', 'Ricardo Dalisay', 'Liza Soberano'
];

export const seedRealisticDatabase = async () => {
  console.log("Starting realistic seed...");
  const usersRef = collection(db, 'users');
  const logsRef = collection(db, 'visitorLogs');

  try {
    const dummyUsers = [];

    // 1. Create 12 Real Users
    for (let i = 0; i < REAL_NAMES.length; i++) {
      const type = i > 9 ? 'Faculty' : 'Student'; // Mix of types
      const userData = {
        uid: `user_seed_${i}`,
        displayName: REAL_NAMES[i],
        email: `${REAL_NAMES[i].toLowerCase().replace(/\s/g, '.')}@neu.edu.ph`,
        schoolId: `24-${10625 + i}-109`, // Incremental IDs
        college: COLLEGES[Math.floor(Math.random() * COLLEGES.length)],
        userType: type,
        role: 'student',
        isBlocked: false,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', userData.uid), userData);
      dummyUsers.push(userData);
    }

    // 2. Create 40 Visitor Logs
    for (let j = 0; j < 40; j++) {
      const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
      
      // Spread logs over the last 14 days
      const timeInDate = new Date();
      timeInDate.setDate(timeInDate.getDate() - Math.floor(Math.random() * 14));
      timeInDate.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60)); // Between 8AM and 6PM

      const isOut = Math.random() > 0.15; // 85% checked out
      
      let logEntry = {
        uid: randomUser.uid,
        name: randomUser.displayName,
        email: randomUser.email,
        college: randomUser.college,
        userType: randomUser.userType,
        purpose: PURPOSES[Math.floor(Math.random() * PURPOSES.length)],
        timeIn: Timestamp.fromDate(timeInDate),
        status: isOut ? 'checked-out' : 'checked-in',
        createdAt: Timestamp.fromDate(timeInDate),
      };

      if (isOut) {
        const stayMinutes = Math.floor(Math.random() * 180) + 20; // 20m to 3h
        const timeOutDate = new Date(timeInDate.getTime() + stayMinutes * 60000);
        
        const h = Math.floor(stayMinutes / 60);
        const m = stayMinutes % 60;
        
        logEntry.timeOut = Timestamp.fromDate(timeOutDate);
        logEntry.duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
        logEntry.updatedAt = Timestamp.fromDate(timeOutDate);
      } else {
        logEntry.timeOut = null;
        logEntry.duration = null;
      }

      await addDoc(logsRef, logEntry);
    }

    alert("Dashboard seeded with 12 real users and 40 log entries!");
  } catch (error) {
    console.error("Seed failed:", error);
    alert("Seed failed. Check console.");
  }
};
