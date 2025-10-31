// Spawns the Python AI process and returns structured JSON
const { spawn } = require('child_process');
const path = require('path');

function getPythonExecutable() {
  // Prefer the AI venv python if available
  const aiVenvPython = path.resolve(__dirname, '../../../ai/venv/bin/python');
  return aiVenvPython;
}

function runPythonCreditPredictor(farmerData) {
  return new Promise((resolve, reject) => {
    try {
      const pythonPath = getPythonExecutable();
      const scriptPath = path.resolve(__dirname, '../../../ai/scripts/credit_predictor.py');

      const child = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));

      child.on('error', (err) => {
        // Retry with system python
        try {
          const fallback = spawn('python3', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
          let fOut = '';
          let fErr = '';
          fallback.stdout.on('data', (d) => (fOut += d.toString()));
          fallback.stderr.on('data', (d) => (fErr += d.toString()));
          fallback.on('close', (code) => {
            if (code !== 0) return reject(new Error(`Python fallback exited ${code}: ${fErr}`));
            try { return resolve(JSON.parse(fOut)); } catch (e) { return reject(new Error(`Invalid JSON (fallback): ${e.message}`)); }
          });
          fallback.stdin.write(JSON.stringify(farmerData));
          fallback.stdin.end();
        } catch (e2) {
          reject(err);
        }
      });
      child.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Python exited with code ${code}: ${stderr}`));
        }
        try {
          const parsed = JSON.parse(stdout);
          return resolve(parsed);
        } catch (e) {
          return reject(new Error(`Invalid JSON from Python: ${e.message}. Raw: ${stdout}`));
        }
      });

      // Stream JSON payload to Python stdin
      const payload = JSON.stringify(farmerData);
      child.stdin.write(payload);
      child.stdin.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { runPythonCreditPredictor };


