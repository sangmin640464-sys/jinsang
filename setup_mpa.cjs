const fs = require('fs');
const path = require('path');

// 1. Duplicate App.tsx
const appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// For StudentApp, we enforce loginMode = 'student'
let studentApp = appTsx.replace(/const \[loginMode, setLoginMode\] = useState\('teacher'\);/, "const [loginMode, setLoginMode] = useState<'teacher' | 'student'>('student');");
studentApp = studentApp.replace(/<div className="bg-white\/10 backdrop-blur-xl rounded-3xl p-2 mb-6 border border-white\/20 flex shadow-lg">[\s\S]*?<\/div>/, '<div className="mb-6 hidden"></div>'); // we might need a better regex, or just keep it simple.
// Let's just do a simple replacement for the login switcher.
studentApp = studentApp.replace(/export default function App\(\)/, 'export default function StudentApp()');
fs.writeFileSync('src/StudentApp.tsx', studentApp);

// For TeacherApp, we enforce loginMode = 'teacher' (which is default)
let teacherApp = appTsx.replace(/export default function App\(\)/, 'export default function TeacherApp()');
fs.writeFileSync('src/TeacherApp.tsx', teacherApp);

// 2. Modify main.tsx for student
const mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
const studentMainTsx = mainTsx.replace("import App from './App.tsx'", "import App from './StudentApp.tsx'");
fs.writeFileSync('src/main.tsx', studentMainTsx);

// 3. Create teacher.main.tsx
const teacherMainTsx = mainTsx.replace("import App from './App.tsx'", "import App from './TeacherApp.tsx'");
fs.writeFileSync('src/teacher.main.tsx', teacherMainTsx);

// 4. Create teacher/index.html
if (!fs.existsSync('teacher')) {
    fs.mkdirSync('teacher');
}
const indexHtml = fs.readFileSync('index.html', 'utf8');
const teacherIndexHtml = indexHtml.replace('src="/src/main.tsx"', 'src="/src/teacher.main.tsx"');
fs.writeFileSync('teacher/index.html', teacherIndexHtml);

// 5. Update vite.config.ts
const viteConfigContent = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          teacher: path.resolve(__dirname, 'teacher/index.html')
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
`;
fs.writeFileSync('vite.config.ts', viteConfigContent);

console.log('Successfully set up Vite MPA with TSX!');
