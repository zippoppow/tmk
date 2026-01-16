'use client';

import { testAPI } from '../../lib/api-test';
import { useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    console.log('Running TMK API Integration Tests from the browser...');
    const testResults = await testAPI.testAllEndpoints();
    console.log('Test execution finished.');
    setResults(testResults);
    setIsRunning(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>TMK API Integration Tests</h1>
      <p>
        Open the browser's developer console to see detailed logs.
      </p>
      <button 
        onClick={runTests} 
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
        }}
      >
        {isRunning ? 'Running Tests...' : 'Run All Tests'}
      </button>
      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results Summary:</h2>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Object.entries(results).map(([name, result]) => (
              <li 
                key={name} 
                style={{ 
                  color: result.success ? 'green' : 'red',
                  marginBottom: '10px',
                  border: '1px solid #eee',
                  padding: '10px',
                  borderRadius: '5px',
                }}
              >
                <strong>{result.success ? '✓ PASS' : '✗ FAIL'}</strong> - {name}
                {!result.success && <p style={{ margin: '5px 0 0', color: '#333' }}>Error: {result.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
