import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { generateCSS } from './cssGenerate.mjs';
import { execSync } from 'node:child_process';

export const brand = 'ids';
export const branches = { components: [], foundation: [] };

const TARGET_DIR = path.resolve(process.cwd(),'temp'); 
const TEMP_REPO_DIR = path.resolve(process.cwd(), 'temp\/temp-repo');
const REPO_URL = process.env.CORE_WEB_REPO; //slice(2)[0];
//$env:CORE_WEB_REPO='https://github.com/i-Cell-Mobilsoft-Open-Source/ids-core-web
console.error('process.argv-> ', process.argv);
console.error('REPO_URL-> ', REPO_URL);

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR);
} 

if (!fs.existsSync(TEMP_REPO_DIR)) {
  fs.mkdirSync(TEMP_REPO_DIR);
} 

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
            console.info(`✅ Found ${branches.length} branches:`, branches);
    } catch (error) {
        console.error('❌ Error fetching branches:', error);
        await fs.remove(TARGET_DIR);
        process.exit(1);
    }
}

async function cloneRepository() {
    console.info(`🤖 Cloning repository from ${REPO_URL}...`);
    execSync(`git clone ${REPO_URL} ${TEMP_REPO_DIR}`, { encoding: 'utf8' });
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
            fs.copySync(sourceFile, destFile);
          } else {
            fs.copyFileSync(sourceFile, destFile);
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
