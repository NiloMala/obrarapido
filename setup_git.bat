@echo off
cd /d "C:\Users\CASA\Desktop\sas"

echo Configurando Git...
git config user.name "Nilton"
git config user.email "nilton.n.prado@gmail.com"

echo Inicializando repositorio...
git init

echo Criando .gitignore...
(
echo # Dependencies
echo node_modules/
echo .pnpm-store/
echo.
echo # Next.js
echo .next/
echo out/
echo.
echo # Environment variables
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo.
echo # Logs
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo pnpm-debug.log*
echo.
echo # Runtime data
echo pids
echo *.pid
echo *.seed
echo *.pid.lock
echo.
echo # Coverage directory used by tools like istanbul
echo coverage/
echo *.lcov
echo.
echo # nyc test coverage
echo .nyc_output
echo.
echo # OS generated files
echo .DS_Store
echo .DS_Store?
echo ._*
echo .Spotlight-V100
echo .Trashes
echo ehthumbs.db
echo Thumbs.db
) > .gitignore

echo Adicionando arquivos...
git add .

echo Fazendo commit inicial...
git commit -m "Initial commit: SAS platform with client and professional dashboards"

echo Adicionando repositorio remoto...
git remote add origin https://github.com/NiloMala/obrarapido.git

echo Fazendo push para GitHub...
git push -u origin main

echo.
echo Processo concluido! Pressione qualquer tecla para continuar...
pause
