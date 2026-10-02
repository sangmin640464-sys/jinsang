const fs = require('fs');

function cleanStudentApp() {
    let content = fs.readFileSync('src/StudentApp.tsx', 'utf8');
    content = content.replace("const [loginMode, setLoginMode] = useState<'teacher' | 'student'>('teacher');", "const [loginMode, setLoginMode] = useState<'teacher' | 'student'>('student');");
    
    content = content.replace('<div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10">', '<div className="hidden grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10">');
    
    fs.writeFileSync('src/StudentApp.tsx', content);
}

function cleanTeacherApp() {
    let content = fs.readFileSync('src/TeacherApp.tsx', 'utf8');
    content = content.replace('<div className="grid grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10">', '<div className="hidden grid-cols-2 p-1.5 rounded-2xl bg-white/10 border border-white/10">');
    
    fs.writeFileSync('src/TeacherApp.tsx', content);
}

cleanStudentApp();
cleanTeacherApp();
