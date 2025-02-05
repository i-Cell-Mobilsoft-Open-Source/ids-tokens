import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { generateCSS } from './cssGenerate.mjs';
import { execSync } from 'node:child_process';

export const brand = 'ids';
export const branches = { components: [], foundation: [] };

const TARGET_DIR = path.resolve(process.cwd(),'temp'); 
const TEMP_REPO_DIR = path.resolve(process.cwd(), 'temp\/temp-repo');
const REPO_URL = process.argv.slice(2)[0];
// fs.ensureDir(TARGET_DIR);
// fs.ensureDir(TEMP_REPO_DIR);

if (!fs.existsSync(TARGET_DIR)) {
  console.info("📂 TARGET_DIR directory will create:", TARGET_DIR);
  fs.mkdirSync(TARGET_DIR);
} else {
  console.info("📂 TARGET_DIR directory already exists:", TARGET_DIR);
  console.info("TARGET_DIR directory process.cwd -> ",process.cwd());
}

if (!fs.existsSync(TEMP_REPO_DIR)) {
  console.info("📂 TEMP_REPO_DIR directory will create:", TEMP_REPO_DIR);
  fs.mkdirSync(TEMP_REPO_DIR);
} else {
  console.info("📂 TEMP_REPO_DIR directory already exists:", TEMP_REPO_DIR);
  console.info("TEMP_REPO_DIR directory process.cwd -> ",process.cwd());
}

console.info("TARGET_DIR -> ", TARGET_DIR);
console.info("TEMP_REPO_DIR -> ", TEMP_REPO_DIR);

const git = simpleGit(TEMP_REPO_DIR);

if (!REPO_URL) {
    console.error("❌ Missing repository URL! Usage: node tokenProcessor.mjs -> ex. pnpm run generate -- https://github.com/group/repo.git");
    await fs.remove(TARGET_DIR);
    process.exit(1);
}
console.info("✅ Processing repo:", REPO_URL);

console.info("process.cwd -> ",process.cwd());

async function getBranches() {
    try {
        const bran = await git.listRemote(['--heads', REPO_URL]);
        const branchList = bran
            .split('\n')
            .map(line => line.split('\t')[1]?.replace(/^refs\/heads\//, '').trim()).filter(branch => branch);
            branchList.map(branch => branch === 'main' ? branches.foundation.push('main') : branches.components.push(branch));
    } catch (error) {
        console.error('❌ Error fetching branches:', error);
        await fs.remove(TARGET_DIR);
        process.exit(1);
    }
}

async function cloneRepository() {
    

    if (!fs.existsSync(TEMP_REPO_DIR)) {
      console.info("📂 CLONE PART TEMP_REPO_DIR directory will create:", TEMP_REPO_DIR);
    } else {
      console.info("📂 CLONE PART TEMP_REPO_DIR directory already exists:", TEMP_REPO_DIR);
    }
    console.info("clone process.cwd -> ",process.cwd());
    console.info(`🤖 Cloning repository from ${REPO_URL}...`);
    // await git.clone(REPO_URL, TEMP_REPO_DIR);
    console.info("clone process.cwd -> ",process.cwd());

    try {
      const output = execSync(`git clone ${REPO_URL} ${TEMP_REPO_DIR}`, { encoding: 'utf8' });
      console.log(output);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }

    await git.fetch(['--all']);
}

async function generateTempFiles(branches, destinationDir ) {
  const branchDir = path.join(TEMP_REPO_DIR);
  const files = await fs.readdir(branchDir);
  const localBranches = (await git.branch()).all;
  try {
    for (const branch of branches) {  
      if (localBranches.includes(branch)) {      
        console.info(`Branch '${branch}' already exists locally. Checking out...`); 
        await git.checkout(branch);
      } else {
        console.info(`Creating and checking out local branch '${branch}' from origin/${branch}...`);
        await git.checkout(['-b', branch, '--track', `origin/${branch}`]);
      }
      
      for (const file of files) {
        const sourceFile = path.join(branchDir, file);
        const destFile = path.join(destinationDir, branch, file);
        if (file === 'tokens') {
          const stat = await fs.lstat(sourceFile);
          if (stat.isDirectory()) {
            await fs.copy(sourceFile, destFile);
          } else {
            await fs.copyFile(sourceFile, destFile);
          }
        }
      }
    }
  }
  catch (error) {
    console.error('❌ Error checkouting branches:', error);
    await fs.remove(TARGET_DIR);
    process.exit(1);
  }
}

async function processBranches() {
  console.time('Processing tokens');
  await getBranches();
  await cloneRepository();
  await generateTempFiles(branches.foundation, path.join(TARGET_DIR, 'foundation'));
  await generateTempFiles(branches.components, path.join(TARGET_DIR, 'components'));
  generateCSS();
  console.info('✅ All branches processed successfully!');   
  await fs.remove(TARGET_DIR);
  console.info('✅ Cleanup completed!');
  console.timeEnd('Processing tokens');
}

processBranches().catch((error) => console.error('Error:', error));
