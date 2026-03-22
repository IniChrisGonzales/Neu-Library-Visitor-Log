import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [scanResult, setScanResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    setError('');
    setScanResult('');

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        console.warn('QR scan error:', errorMessage);
      }
    );
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      setScanResult(decodedText);
      stopScanning();

      // Parse the QR code data (school ID)
      const schoolId = decodedText.trim();

      // Check if user exists and get their data
      const userQuery = await db.collection('users').where('schoolId', '==', schoolId).get();
      if (userQuery.empty) {
        throw new Error('User not found with this school ID');
      }

      const userData = userQuery.docs[0].data();
      const userId = userQuery.docs[0].id;

      // Create check-in log
      await addDoc(collection(db, 'visitorLogs'), {
        userId: userId,
        schoolId: schoolId,
        name: userData.name || 'Unknown',
        email: userData.email || '',
        college: userData.college || '',
        userType: userData.userType || '',
        purpose: 'Library Visit', // Default purpose for QR check-in
        checkInTime: serverTimestamp(),
        checkedInBy: user.email,
        checkInMethod: 'QR Code'
      });

      if (onScanSuccess) {
        onScanSuccess({
          ...userData,
          schoolId: schoolId,
          userId: userId
        });
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setError(error.message || 'Failed to process check-in');
      if (onScanError) {
        onScanError(error);
      }
    }
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">QR Code Scanner</h3>

      {!scanning ? (
        <div className="text-center">
          <button
            onClick={startScanning}
            className="bg-neu-blue hover:bg-neu-blue/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start Scanning
          </button>
          <p className="text-dark-400 mt-2 text-sm">
            Click to start scanning QR codes for check-in
          </p>
        </div>
      ) : (
        <div>
          <div id="qr-reader" className="w-full max-w-md mx-auto mb-4"></div>
          <div className="text-center">
            <button
              onClick={stopScanning}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Stop Scanning
            </button>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
          <p className="text-green-400 font-medium">Check-in Successful!</p>
          <p className="text-dark-300 text-sm">School ID: {scanResult}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 font-medium">Scan Error</p>
          <p className="text-dark-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;