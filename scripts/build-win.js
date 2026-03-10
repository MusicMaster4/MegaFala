const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

if (process.platform !== 'win32') {
  console.error('This build script must be run on Windows.');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));
const productName = packageJson.productName || packageJson.name || 'MegaFala';
const electronBuilderCli = path.join(projectRoot, 'node_modules', 'electron-builder', 'cli.js');
const distDir = path.join(projectRoot, 'dist');
const unpackedDir = path.join(distDir, 'win-unpacked');
const executablePath = path.join(unpackedDir, `${productName}.exe`);
const iconPath = path.join(projectRoot, 'src', 'assets', 'megaf.ico');
const rceditBinaryName = process.arch === 'ia32' ? 'rcedit-ia32.exe' : 'rcedit-x64.exe';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findLatestRceditBinary() {
  const searchRoots = [];
  const customCacheDir = process.env.ELECTRON_BUILDER_CACHE;
  const localAppData = process.env.LOCALAPPDATA;

  if (customCacheDir) {
    searchRoots.push(customCacheDir);
  }
  if (localAppData) {
    searchRoots.push(path.join(localAppData, 'electron-builder', 'Cache'));
  }

  const candidates = [];

  for (const rootDir of searchRoots) {
    const cacheDir = path.join(rootDir, 'winCodeSign');
    if (!fs.existsSync(cacheDir)) {
      continue;
    }

    const stack = [cacheDir];
    while (stack.length > 0) {
      const currentDir = stack.pop();
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }

        if (entry.isFile() && entry.name.toLowerCase() === rceditBinaryName.toLowerCase()) {
          candidates.push({
            candidate: fullPath,
            mtimeMs: fs.statSync(fullPath).mtimeMs,
          });
        }
      }
    }
  }

  candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);

  return candidates[0]?.candidate || null;
}

async function main() {
  fs.rmSync(distDir, { recursive: true, force: true });

  run(process.execPath, [path.join(projectRoot, 'scripts', 'build-python.js')]);

  run(process.execPath, [
    electronBuilderCli,
    '--win',
    'dir',
    '--config.win.signAndEditExecutable=false',
  ]);

  if (!fs.existsSync(executablePath)) {
    console.error(`Expected executable not found: ${executablePath}`);
    process.exit(1);
  }

  const rceditPath = findLatestRceditBinary();
  if (!rceditPath) {
    console.warn(`Unable to locate ${rceditBinaryName} in the electron-builder cache. Skipping rcedit metadata patch.`);
  } else {
    run(rceditPath, [
      executablePath,
      '--set-version-string',
      'FileDescription',
      productName,
      '--set-version-string',
      'ProductName',
      productName,
      '--set-icon',
      iconPath,
    ]);
  }

  run(process.execPath, [
    electronBuilderCli,
    '--win',
    'nsis',
    '--prepackaged',
    unpackedDir,
    '--config.win.signAndEditExecutable=false',
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
